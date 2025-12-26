// backend/services/adService.js - VERSION FINALE AVEC RECHERCHE DE GROUPES ET MODE OFFLINE + SUPPORT SERVEUR AD DISTANT

const { executeEncodedPowerShell } = require('./powershellService');
const databaseService = require('./databaseService');
const configService = require('./configService');

function getAdConfig() {
    try {
        return configService.getConfig();
    } catch (error) {
        console.error('[AD] Erreur lecture configuration:', error.message);
        return null;
    }
}

// Fonction pour générer le préambule PowerShell avec credentials et serveur
function getAdAuthPreambule() {
    const config = getAdConfig();
    if (!config) return '';

    const { ad_server, domain, username, password } = config;

    // Si pas de serveur AD spécifié, utiliser le comportement par défaut
    if (!ad_server) return '';

    // Créer le bloc de credentials PowerShell
    return `
        $adServer = "${ad_server}"
        $adDomain = "${domain}"
        $adUsername = "${domain}\\${username}"
        $adPassword = ConvertTo-SecureString "${password}" -AsPlainText -Force
        $adCredential = New-Object System.Management.Automation.PSCredential($adUsername, $adPassword)
    `;
}

// Fonction pour ajouter les paramètres AD aux commandes
function getAdParams() {
    const config = getAdConfig();
    if (!config || !config.ad_server) return '';
    return ' -Server $adServer -Credential $adCredential';
}

// ... (parseAdError et les autres fonctions existantes restent identiques)
function parseAdError(errorMessage) {
    if (!errorMessage) return "Une erreur inconnue est survenue.";
    const lowerError = errorMessage.toLowerCase();
    if (lowerError.includes("cannot find an object with identity")) return "L'utilisateur ou le groupe spécifié n'a pas été trouvé dans Active Directory.";
    if (lowerError.includes("the object already exists")) return "Un utilisateur ou un groupe avec ce nom existe déjà.";
    if (lowerError.includes("access is denied")) return "Permissions insuffisantes pour effectuer cette action dans Active Directory.";
    if (lowerError.includes("the server is unwilling to process the request")) return "Le mot de passe ne respecte pas les règles de complexité du domaine.";
    if (lowerError.includes("the specified module 'activedirectory' was not loaded")) return "Le module PowerShell 'ActiveDirectory' n'est pas installé ou n'a pas pu être chargé.";
    return errorMessage.split('At line:')[0].trim();
}

async function searchAdUsers(searchTerm) {
    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const psScript = `
        ${authPreambule}
        Import-Module ActiveDirectory -ErrorAction Stop
        Get-ADUser${adParams} -Filter "SamAccountName -like '*${searchTerm}*' -or DisplayName -like '*${searchTerm}*'" -Properties DisplayName,EmailAddress,Enabled |
            Select-Object -First 10 SamAccountName,DisplayName,EmailAddress,Enabled | ConvertTo-Json -Compress
    `;
    try {
        const jsonOutput = await executeEncodedPowerShell(psScript, 10000);
        const users = JSON.parse(jsonOutput || '[]');
        return Array.isArray(users) ? users : [users];
    } catch (e) {
        return [];
    }
}

// ✅ NOUVELLE FONCTION
async function searchAdGroups(searchTerm) {
    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const psScript = `
        ${authPreambule}
        Import-Module ActiveDirectory -ErrorAction Stop
        Get-ADGroup${adParams} -Filter "Name -like '*${searchTerm}*'" |
            Select-Object -First 20 Name | ConvertTo-Json -Compress
    `;
    try {
        const jsonOutput = await executeEncodedPowerShell(psScript, 10000);
        const groups = JSON.parse(jsonOutput || '[]');
        const groupsArray = Array.isArray(groups) ? groups : [groups];
        return groupsArray.map(g => g.Name); // Renvoie un tableau de noms de groupes
    } catch (e) {
        console.error(`Erreur recherche de groupes AD pour '${searchTerm}':`, parseAdError(e.message));
        return [];
    }
}

// ... (toutes les autres fonctions comme getAdGroupMembers, addUserToGroup, etc. restent identiques)
async function getAdGroupMembers(groupName) {
    // ✅ MODE OFFLINE: Retourne tableau vide si pas de réseau AD
    if (databaseService.isInOfflineMode()) {
        console.warn(`⚠️  Mode offline activé - Impossible d'accéder aux groupes AD`);
        return [];
    }

    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const psScript = `
        ${authPreambule}
        Import-Module ActiveDirectory -ErrorAction Stop
        $groupName = "${groupName}"
        $group = Get-ADGroup${adParams} -Identity $groupName -ErrorAction SilentlyContinue
        if (-not $group) {
            throw "Le groupe '$groupName' est introuvable dans Active Directory."
        }
        $members = Get-ADGroupMember${adParams} -Identity $groupName -Recursive |
            Where-Object { $_.objectClass -eq 'user' } |
            Get-ADUser${adParams} -Properties DisplayName |
            Select-Object SamAccountName, Name, DisplayName
        if ($members) {
            $members | ConvertTo-Json -Compress
        } else {
            '[]'
        }
    `;
    try {
        const jsonOutput = await executeEncodedPowerShell(psScript, 30000);  // ← Augmenté de 15s à 30s
        const members = JSON.parse(jsonOutput || '[]');
        const membersArray = Array.isArray(members) ? members : [members];
        return membersArray.map(m => ({ ...m, sam: m.SamAccountName, name: m.Name || m.DisplayName }));
    } catch (e) {
        console.error(`Erreur lors de la récupération des membres du groupe AD '${groupName}':`, parseAdError(e.message));
        // ✅ NE PAS CRASHER - Retourner tableau vide
        return [];
    }
}

async function addUserToGroup(username, groupName) {
    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const psScript = `
        ${authPreambule}
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            Add-ADGroupMember${adParams} -Identity "${groupName}" -Members "${username}" -ErrorAction Stop
            @{success = $true} | ConvertTo-Json -Compress
        } catch {
            @{success = $false; error = $_.Exception.Message} | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 10000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function removeUserFromGroup(username, groupName) {
    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const psScript = `
        ${authPreambule}
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            Remove-ADGroupMember${adParams} -Identity "${groupName}" -Members "${username}" -Confirm:$false -ErrorAction Stop
            @{success = $true} | ConvertTo-Json -Compress
        } catch {
            @{success = $false; error = $_.Exception.Message} | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 10000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function getAdUserDetails(username) {
    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const psScript = `
        ${authPreambule}
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            $user = Get-ADUser${adParams} -Identity "${username}" -Properties * -ErrorAction Stop
            $groups = Get-ADPrincipalGroupMembership${adParams} -Identity $user | Select-Object -ExpandProperty Name
            $result = @{
                success = $true
                user = @{
                    username = $user.SamAccountName; displayName = $user.DisplayName; email = $user.EmailAddress
                    enabled = $user.Enabled; description = $user.Description
                    lastLogon = if ($user.LastLogonDate) { $user.LastLogonDate.ToUniversalTime().ToString("o") } else { $null }
                    passwordLastSet = if ($user.PasswordLastSet) { $user.PasswordLastSet.ToUniversalTime().ToString("o") } else { $null }
                    created = if ($user.Created) { $user.Created.ToUniversalTime().ToString("o") } else { $null }
                }
                groups = $groups
            }
            $result | ConvertTo-Json -Compress -Depth 4
        } catch {
            @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 20000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function disableAdUser(username) {
    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const psScript = `
        ${authPreambule}
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            Disable-ADAccount${adParams} -Identity "${username}" -ErrorAction Stop
            @{ success = $true; message = "Compte désactivé avec succès" } | ConvertTo-Json -Compress
        } catch {
            @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 10000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function enableAdUser(username) {
    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const psScript = `
        ${authPreambule}
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            Enable-ADAccount${adParams} -Identity "${username}" -ErrorAction Stop
            @{ success = $true; message = "Compte activé avec succès" } | ConvertTo-Json -Compress
        } catch {
            @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 10000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function resetAdUserPassword(username, newPassword, mustChangePassword = true) {
    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const escapeParam = (str) => str ? str.replace(/"/g, '`"') : '';
    const psScript = `
        ${authPreambule}
        try {
            Import-Module ActiveDirectory -ErrorAction Stop
            $securePassword = ConvertTo-SecureString "${escapeParam(newPassword)}" -AsPlainText -Force
            Set-ADAccountPassword${adParams} -Identity "${escapeParam(username)}" -NewPassword $securePassword -Reset -ErrorAction Stop
            Set-ADUser${adParams} -Identity "${escapeParam(username)}" -ChangePasswordAtLogon $${mustChangePassword} -ErrorAction Stop
            @{ success = $true; message = "Mot de passe réinitialisé avec succès" } | ConvertTo-Json -Compress
        } catch {
            @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
    `;
    try {
        const result = await executeEncodedPowerShell(psScript, 15000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

async function createAdUser(userData) {
    const {
        username, firstName, lastName, displayName, email, password,
        ouPath, changePasswordAtLogon = false, description = '',
        userCannotChangePassword = true,
        passwordNeverExpires = true,
        copyFromUsername
    } = userData;

    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const escapeParam = (str) => str ? str.replace(/"/g, '`"') : '';

    // ✅ CORRECTION: Extraire le domaine depuis email ou obtenir depuis AD
    const config = getAdConfig();
    const domain = config?.domain || 'anecoopfr.local';  // Domaine par défaut
    const emailDomain = email.split('@')[1] || domain;

    const psScript = `
        ${authPreambule}
        try {
            Import-Module ActiveDirectory -ErrorAction Stop

            # ✅ VALIDATION: Vérifier que le chemin OU existe
            $ouPath = "${escapeParam(ouPath)}"
            try {
                Get-ADOrganizationalUnit${adParams} -Identity $ouPath -ErrorAction Stop | Out-Null
            } catch {
                throw "Le chemin OU n'existe pas: $ouPath. Vérifiez que l'OU est correctement créée dans Active Directory."
            }

            # ✅ VALIDATION: Vérifier que l'utilisateur n'existe pas déjà
            $existingUser = Get-ADUser${adParams} -Filter "SamAccountName -eq '${escapeParam(username)}'" -ErrorAction SilentlyContinue
            if ($existingUser) {
                throw "Un utilisateur avec le login '${escapeParam(username)}' existe déjà dans Active Directory."
            }

            $securePassword = ConvertTo-SecureString "${escapeParam(password)}" -AsPlainText -Force
            $params = @{
                SamAccountName = "${escapeParam(username)}"
                Name = "${escapeParam(displayName || `${firstName} ${lastName}`)}"
                GivenName = "${escapeParam(firstName)}"
                Surname = "${escapeParam(lastName)}"
                DisplayName = "${escapeParam(displayName || `${firstName} ${lastName}`)}"
                UserPrincipalName = "${escapeParam(username)}@${domain}"
                EmailAddress = "${escapeParam(email)}"
                AccountPassword = $securePassword
                Enabled = $true
                ChangePasswordAtLogon = $${changePasswordAtLogon}
                Path = $ouPath
            }
            if ("${escapeParam(description)}") { $params.Description = "${escapeParam(description)}" }

            $newUser = New-ADUser${adParams} @params -ErrorAction Stop -PassThru
            Set-ADUser${adParams} -Identity $newUser -UserCannotChangePassword $${userCannotChangePassword} -PasswordNeverExpires $${passwordNeverExpires} -ErrorAction Stop

            # Copier les groupes d'un utilisateur existant si demandé
            $copyFrom = "${escapeParam(copyFromUsername)}"
            if ($copyFrom) {
                try {
                    $sourceUser = Get-ADUser${adParams} -Identity $copyFrom -ErrorAction Stop
                    $groups = Get-ADPrincipalGroupMembership${adParams} -Identity $sourceUser | Select-Object -ExpandProperty SamAccountName
                    foreach ($group in $groups) {
                        if ($group -ne "Domain Users") {
                            Add-ADGroupMember${adParams} -Identity $group -Members $newUser -ErrorAction SilentlyContinue
                        }
                    }
                } catch {
                    Write-Warning "Impossible de copier les groupes depuis $copyFrom : $($_.Exception.Message)"
                }
            }

            @{ success = $true; username = "${escapeParam(username)}"; message = "Utilisateur créé avec succès dans AD" } | ConvertTo-Json -Compress
        } catch {
            @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
        }
    `;

    try {
        const result = await executeEncodedPowerShell(psScript, 45000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}


async function getAdOUs(parentId = null) {
    // ✅ MODE OFFLINE: Retourne tableau vide si pas de réseau AD
    if (databaseService.isInOfflineMode()) {
        console.warn(`⚠️  Mode offline activé - Impossible d'accéder aux OUs Active Directory`);
        return [];
    }

    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const parentOuDn = parentId ? `"${parentId}"` : `(Get-ADDomain${adParams}).DistinguishedName`;
    const psScript = `
        ${authPreambule}
        Import-Module ActiveDirectory -ErrorAction Stop
        $searchBase = ${parentOuDn}

        $ous = Get-ADOrganizationalUnit${adParams} -Filter * -SearchBase $searchBase -SearchScope OneLevel | Select-Object Name, DistinguishedName

        $result = @()
        foreach ($ou in $ous) {
            $childrenCount = (Get-ADOrganizationalUnit${adParams} -Filter * -SearchBase $ou.DistinguishedName -SearchScope OneLevel).Count
            $result += [PSCustomObject]@{
                id          = $ou.DistinguishedName
                name        = $ou.Name
                hasChildren = $childrenCount -gt 0
            }
        }
        $result | ConvertTo-Json -Compress
    `;
    try {
        const jsonOutput = await executeEncodedPowerShell(psScript, 20000);
        const ous = JSON.parse(jsonOutput || '[]');
        return Array.isArray(ous) ? ous : [ous];
    } catch (e) {
        console.error(`Erreur lors de la récupération des OUs AD pour '${parentId || 'root'}':`, parseAdError(e.message));
        // ✅ NE PAS CRASHER - Retourner tableau vide
        return [];
    }
}

// ✅ NOUVELLE FONCTION: Créer le dossier utilisateur avec quota et lecteur réseau
async function createUserFolderWithQuota(userData) {
    const {
        username,
        fileServerPath = '\\\\192.168.1.230\\Utilisateurs',  // ✅ Chemin réseau configuré
        quotaGB = 5,  // Quota par défaut de 5 Go
        driveLetter = 'U:'  // ✅ Lettre de lecteur U: comme demandé
    } = userData;

    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const escapeParam = (str) => str ? str.replace(/"/g, '`"') : '';
    const quotaBytes = quotaGB * 1024 * 1024 * 1024;  // Convertir Go en octets

    // ✅ CORRECTION: Obtenir le domaine depuis config
    const config = getAdConfig();
    const domain = config?.domain || 'anecoopfr.local';

    const psScript = `
        ${authPreambule}
        try {
            Import-Module ActiveDirectory -ErrorAction Stop

            # ✅ VALIDATION: Vérifier que l'utilisateur existe dans AD
            try {
                $user = Get-ADUser${adParams} -Identity "${escapeParam(username)}" -ErrorAction Stop
            } catch {
                throw "L'utilisateur '${escapeParam(username)}' n'existe pas dans Active Directory. Créez d'abord l'utilisateur avant de créer son dossier."
            }

            # Créer le chemin complet du dossier utilisateur
            $userFolder = "${escapeParam(fileServerPath)}\\${escapeParam(username)}"
            $quotaLimit = ${quotaBytes}

            # ✅ VALIDATION: Vérifier que le chemin de base existe
            $basePath = "${escapeParam(fileServerPath)}"
            if (-not (Test-Path $basePath)) {
                throw "Le chemin serveur de fichiers n'existe pas: $basePath. Vérifiez le partage réseau."
            }

            # Vérifier si le dossier existe déjà
            $folderCreated = $false
            if (-not (Test-Path $userFolder)) {
                # Créer le dossier
                New-Item -Path $userFolder -ItemType Directory -Force | Out-Null
                Write-Host "✅ Dossier créé: $userFolder"
                $folderCreated = $true
            } else {
                Write-Host "ℹ️  Le dossier existe déjà: $userFolder"
            }

            # Définir les permissions NTFS (l'utilisateur a le contrôle total sur son dossier)
            try {
                $acl = Get-Acl $userFolder

                # Supprimer l'héritage pour contrôle total
                $acl.SetAccessRuleProtection($true, $false)

                # Ajouter les permissions pour l'utilisateur (SamAccountName ou Domain\\Username)
                $userPrincipal = "$env:USERDOMAIN\\${escapeParam(username)}"
                $userRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
                    $userPrincipal,
                    "FullControl",
                    "ContainerInherit,ObjectInherit",
                    "None",
                    "Allow"
                )
                $acl.AddAccessRule($userRule)

                # Ajouter les permissions pour les administrateurs
                $adminRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
                    "Administrators",
                    "FullControl",
                    "ContainerInherit,ObjectInherit",
                    "None",
                    "Allow"
                )
                $acl.AddAccessRule($adminRule)

                # Appliquer les permissions
                Set-Acl -Path $userFolder -AclObject $acl
                Write-Host "✅ Permissions NTFS configurées (Contrôle total pour ${escapeParam(username)})"
            } catch {
                Write-Warning "⚠️  Erreur configuration permissions: $($_.Exception.Message)"
            }

            # Configurer le quota sur le volume (nécessite FSRM - File Server Resource Manager)
            $quotaConfigured = $false
            try {
                Import-Module FileServerResourceManager -ErrorAction Stop

                # Créer ou mettre à jour le quota
                $quota = Get-FsrmQuota -Path $userFolder -ErrorAction SilentlyContinue
                if ($quota) {
                    Set-FsrmQuota -Path $userFolder -Size $quotaLimit -ErrorAction Stop
                    Write-Host "✅ Quota mis à jour: ${quotaGB} GB"
                } else {
                    New-FsrmQuota -Path $userFolder -Size $quotaLimit -ErrorAction Stop
                    Write-Host "✅ Quota créé: ${quotaGB} GB"
                }
                $quotaConfigured = $true
            } catch {
                Write-Warning "⚠️  FSRM non disponible ou erreur quota: $($_.Exception.Message)"
                Write-Warning "Le quota ne sera pas appliqué. Installez FSRM sur le serveur de fichiers si nécessaire."
            }

            # Configurer le profil utilisateur AD pour mapper le lecteur réseau
            try {
                Set-ADUser${adParams} -Identity $user -HomeDirectory $userFolder -HomeDrive "${escapeParam(driveLetter)}" -ErrorAction Stop
                Write-Host "✅ Lecteur réseau ${escapeParam(driveLetter)} configuré dans AD"
            } catch {
                Write-Warning "⚠️  Erreur configuration lecteur réseau: $($_.Exception.Message)"
            }

            $message = "Dossier utilisateur créé avec succès"
            if ($folderCreated -eq $false) {
                $message = "Dossier utilisateur déjà existant - Permissions et quota mis à jour"
            }

            @{
                success = $true
                message = $message
                path = $userFolder
                quota = if ($quotaConfigured) { "${quotaGB} GB" } else { "Non configuré (FSRM manquant)" }
                drive = "${escapeParam(driveLetter)}"
                permissions = "Contrôle total pour ${escapeParam(username)}"
            } | ConvertTo-Json -Compress
        } catch {
            @{
                success = $false
                error = $_.Exception.Message
            } | ConvertTo-Json -Compress
        }
    `;

    try {
        const result = await executeEncodedPowerShell(psScript, 30000);
        const parsedResult = JSON.parse(result);
        if (!parsedResult.success) {
            parsedResult.error = parseAdError(parsedResult.error);
        }
        return parsedResult;
    } catch (error) {
        return { success: false, error: parseAdError(error.message) };
    }
}

module.exports = {
    searchAdUsers,
    searchAdGroups, // ✅ EXPORT DE LA NOUVELLE FONCTION
    getAdGroupMembers,
    addUserToGroup,
    removeUserFromGroup,
    getAdUserDetails,
    disableAdUser,
    enableAdUser,
    resetAdUserPassword,
    createAdUser,
    createUserFolderWithQuota, // ✅ NOUVELLE FONCTION EXPORTÉE
    getAdOUs,
    getAdUsersInOU,
};

async function getAdUsersInOU(ouDN) {
    // ✅ MODE OFFLINE: Retourne tableau vide si pas de réseau AD
    if (databaseService.isInOfflineMode()) {
        console.warn(`⚠️  Mode offline activé - Impossible d'accéder aux utilisateurs AD`);
        return [];
    }

    const authPreambule = getAdAuthPreambule();
    const adParams = getAdParams();
    const psScript = `
        ${authPreambule}
        Import-Module ActiveDirectory -ErrorAction Stop
        Get-ADUser${adParams} -Filter * -SearchBase "${ouDN}" -SearchScope OneLevel |
            Select-Object SamAccountName, DisplayName, EmailAddress, Enabled |
            ConvertTo-Json -Compress
    `;
    try {
        const jsonOutput = await executeEncodedPowerShell(psScript, 20000);
        const users = JSON.parse(jsonOutput || '[]');
        return Array.isArray(users) ? users : [users];
    } catch (e) {
        console.error(`Erreur lors de la récupération des utilisateurs de l'OU '${ouDN}':`, parseAdError(e.message));
        // ✅ NE PAS CRASHER - Retourner tableau vide
        return [];
    }
}


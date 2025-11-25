
try {
    console.log('Importing userService...');
    const userService = require('./backend/services/userService');
    console.log('userService imported.');

    console.log('Importing apiRoutes...');
    const apiRoutes = require('./server/apiRoutes');
    console.log('apiRoutes imported.');
} catch (error) {
    console.error('Import Error:', error);
}

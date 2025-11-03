/**
 * Tests pour le middleware de validation
 */

const request = require('supertest');
const express = require('express');
const {
    validateChatMessage,
    validateDocumentSearch,
    sanitizeString,
    sanitizeInputs
} = require('../../server/middleware/validation');

// Application Express de test
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    return app;
};

describe('Middleware de Validation', () => {
    describe('validateChatMessage', () => {
        let app;

        beforeEach(() => {
            app = createTestApp();
            app.post('/test', validateChatMessage, (req, res) => {
                res.json({ success: true, data: req.body });
            });
        });

        test('devrait accepter un message valide', async () => {
            const response = await request(app)
                .post('/test')
                .send({
                    message: 'Bonjour, comment allez-vous ?',
                    sessionId: 'session-123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('devrait rejeter un message vide', async () => {
            const response = await request(app)
                .post('/test')
                .send({
                    message: '',
                    sessionId: 'session-123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test('devrait rejeter un message trop long', async () => {
            const longMessage = 'a'.repeat(6000);
            const response = await request(app)
                .post('/test')
                .send({
                    message: longMessage,
                    sessionId: 'session-123'
                });

            expect(response.status).toBe(400);
        });

        test('devrait rejeter un sessionId invalide', async () => {
            const response = await request(app)
                .post('/test')
                .send({
                    message: 'Hello',
                    sessionId: 'invalid@#$%'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('validateDocumentSearch', () => {
        let app;

        beforeEach(() => {
            app = createTestApp();
            app.post('/test', validateDocumentSearch, (req, res) => {
                res.json({ success: true, data: req.body });
            });
        });

        test('devrait accepter une recherche valide', async () => {
            const response = await request(app)
                .post('/test')
                .send({
                    query: 'facture 2024',
                    maxResults: 10,
                    minScore: 0.5
                });

            expect(response.status).toBe(200);
        });

        test('devrait rejeter une requête vide', async () => {
            const response = await request(app)
                .post('/test')
                .send({
                    query: ''
                });

            expect(response.status).toBe(400);
        });

        test('devrait rejeter maxResults invalide', async () => {
            const response = await request(app)
                .post('/test')
                .send({
                    query: 'test',
                    maxResults: 150 // trop grand
                });

            expect(response.status).toBe(400);
        });
    });

    describe('sanitizeString', () => {
        test('devrait supprimer les caractères de contrôle', () => {
            const dirty = 'Hello\x00World\x1F';
            const clean = sanitizeString(dirty);
            expect(clean).toBe('HelloWorld');
        });

        test('devrait supprimer les balises script', () => {
            const dirty = 'Hello <script>alert("xss")</script>World';
            const clean = sanitizeString(dirty);
            expect(clean).toBe('Hello World');
        });

        test('devrait trim les espaces', () => {
            const dirty = '  Hello World  ';
            const clean = sanitizeString(dirty);
            expect(clean).toBe('Hello World');
        });

        test('devrait gérer les valeurs non-string', () => {
            expect(sanitizeString(123)).toBe(123);
            expect(sanitizeString(null)).toBe(null);
            expect(sanitizeString(undefined)).toBe(undefined);
        });
    });

    describe('sanitizeInputs middleware', () => {
        let app;

        beforeEach(() => {
            app = createTestApp();
            app.use(sanitizeInputs);
            app.post('/test', (req, res) => {
                res.json({ body: req.body, query: req.query });
            });
        });

        test('devrait sanitizer le body', async () => {
            const response = await request(app)
                .post('/test')
                .send({
                    message: '  <script>alert("xss")</script>Hello  ',
                    normal: 'test'
                });

            expect(response.body.body.message).not.toContain('<script>');
            expect(response.body.body.message).toContain('Hello');
            expect(response.body.body.normal).toBe('test');
        });

        test('devrait sanitizer les query params', async () => {
            const response = await request(app)
                .post('/test?search=<script>xss</script>')
                .send({});

            expect(response.body.query.search).not.toContain('<script>');
        });
    });
});

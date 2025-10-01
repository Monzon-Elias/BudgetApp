export const config = {
    mongodbUri: 'mongodb+srv://elios:eliosmbaPass1!!@budgetapp.d6ntesg.mongodb.net/budgetAppDb?retryWrites=true&w=majority',
    jwtSecret: 'budgetApp2025SecretKey!SuperSecure#MonzonProject',
    port: 3000,
    frontendUrl: process.env.NODE_ENV === 'production' 
        ? 'https://budgetsite.netlify.app' 
        : 'http://localhost:5500'
};


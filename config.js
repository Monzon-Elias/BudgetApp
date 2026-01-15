export const config = {
    mongodbUri: process.env.MONGODB_URI
        || 'mongodb+srv://elios:eliosCrA1@budgetapp.d6ntesg.mongodb.net/budgetAppDb?retryWrites=true&w=majority&appName=budgetApp',
    jwtSecret: process.env.JWT_SECRET || 'budgetApp2025SecretKey!SuperSecure#MonzonProject',
    port: process.env.PORT || 3000
};

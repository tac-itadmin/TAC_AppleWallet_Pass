const express = require('express');
const cors = require('cors');
const passGeneratorRouter = require('./passGenerator');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
    origin: '*', // Update this with your Salesforce domain in production
    methods: ['POST']
}));

app.use(express.json());
app.use('/api', passGeneratorRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

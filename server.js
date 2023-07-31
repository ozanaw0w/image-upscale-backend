const express = require('express');
const axios = require('axios');
const waifu2x = require("waifu2x").default;
const fs = require('fs');
const path = require('path');


const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.post('/upscale', async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is missing in the request body.' });
        }

        console.log('Received Image URL:', imageUrl);

        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data);

        const waifu2xOptions = {
            noise: 3,
            scale: 4,
            upscaler: "real-esrgan"
        };

        console.log('Before upscaling');

        const tempImagePath = path.join(__dirname, 'temp', `image_${Date.now()}.png`);
        fs.writeFileSync(tempImagePath, imageBuffer);

        await waifu2x.upscaleImage(tempImagePath, tempImagePath, waifu2xOptions);

        console.log('Image upscaling completed successfully');

        const upscaledImageData = fs.readFileSync(tempImagePath);
        fs.unlinkSync(tempImagePath);

        const base64Image = upscaledImageData.toString('base64');
        const upscaledImageUrl = `data:image/png;base64,${base64Image}`;

        res.json({ upscaledImageUrl });
    } catch (error) {
        console.error('Error during image upscaling:', error);
        res.status(500).json({ error: 'An error occurred during image upscaling.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

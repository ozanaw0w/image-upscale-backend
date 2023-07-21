const express = require('express');
const axios = require('axios');
const waifu2x = require('waifu2x').default;
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

console.log('waifu2x functions:', Object.keys(waifu2x));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.post('/upscale', async (req, res) => {
    try {
        const { imageUrl } = req.body;
        console.log('Received Image URL:', imageUrl);

        const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        console.log('Received Image Buffer:', imageBuffer);


        const tempImagePath = path.join(tempDir, `image_${Date.now()}.png`);
        fs.writeFileSync(tempImagePath, Buffer.from(imageBuffer.data));


        const waifu2xOptions = {
            scale: 4, // Change the scale factor as needed (2, 4, etc.)
            noise: 3, // Change the noise level as needed (0, 1, 2, 3)
            upscaler: "real-esrgan"
        };

        await waifu2x.upscaleImage(tempImagePath, tempImagePath, waifu2xOptions);


        const upscaledImageData = fs.readFileSync(tempImagePath);
        const base64Image = Buffer.from(upscaledImageData).toString('base64');
        const upscaledImageUrl = `data:image/png;base64,${base64Image}`;


        fs.unlinkSync(tempImagePath);

        res.json({ upscaledImageUrl });
    } catch (error) {
        console.error('Error during image upscaling:', error);
        res.status(500).json({ error: 'An error occurred during image upscaling.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


async function testImageGen() {
    try {
        console.log("Testing image generation for 'Pongal'...");
        const response = await fetch('http://localhost:3002/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ festivalName: 'Pongal' })
        });

        const data = await response.json();
        console.log("Meta Response:", data);

        if (!data.imageUrl) {
            console.error("❌ No image URL returned");
            return;
        }

        console.log(`Checking Image Response...`);

        if (data.imageUrl.startsWith('data:image/')) {
            console.log("✅ Received Base64 Image (likely from Hugging Face AI)");
            const base64Data = data.imageUrl.split(',')[1];
            const byteLength = (base64Data.length * 3) / 4;
            console.log(`Image Size: ~${Math.round(byteLength)} bytes`);

            if (byteLength > 1000) {
                console.log("✅ Image has valid size.");
            } else {
                console.error("❌ Image too small.");
            }
        } else if (data.imageUrl.startsWith('http')) {
            console.log(`Received URL: ${data.imageUrl}`);
            // Fetch the actual image to see if it's reachable and valid
            const imgResponse = await fetch(data.imageUrl);
            console.log(`Image Fetch Status: ${imgResponse.status}`);

            if (imgResponse.ok) {
                const buffer = await imgResponse.arrayBuffer();
                console.log(`Image Size: ${buffer.byteLength} bytes`);
                if (buffer.byteLength < 1000) {
                    console.error("❌ Image too small, likely an error page or empty.");
                } else {
                    console.log("✅ Image is reachable and has content.");
                }
            } else {
                console.error("❌ Image URL returned error status.");
            }
        } else {
            console.error("❌ Unknown image format received");
        }

    } catch (e) {
        console.error("Test failed:", e);
    }
}

testImageGen();

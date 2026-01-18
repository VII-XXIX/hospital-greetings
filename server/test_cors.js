
async function checkCors() {
    const url = "https://image.pollinations.ai/prompt/festive%20background%20wallpaper,%20happy%20pongal?nologo=true&model=flux&width=800&height=1000";

    console.log(`Testing URL: ${url}`);

    try {
        const response = await fetch(url, { method: 'HEAD' });
        console.log(`Status: ${response.status}`);
        const corsHeader = response.headers.get('access-control-allow-origin');
        console.log(`CORS Header: ${corsHeader}`);

        if (corsHeader === '*' || corsHeader === 'null') {
            console.log("✅ CORS is properly configured.");
        } else {
            console.log("❌ CORS Header missing or incorrect.");
        }
    } catch (error) {
        console.error("Fetch failed:", error.message);
    }
}

checkCors();

$urls = Get-Content thaipoosam_urls.txt
$i = 1
foreach ($url in $urls) {
    if ($url -match 'http') {
        $outFile = "public/templates/thai_batch_$i.jpg"
        Write-Host "Downloading $url to $outFile"
        try {
            Invoke-WebRequest -Uri $url -OutFile $outFile -ErrorAction Stop
            $i++
        }
        catch {
            Write-Warning "Failed to download $url"
        }
    }
}

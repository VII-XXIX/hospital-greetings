$urls = Get-Content valentine_urls.txt
$i = 1
foreach ($url in $urls) {
    if ($url -match 'http') {
        $outFile = "public/templates/valentine_batch_$i.jpg"
        Write-Host "Downloading $url to $outFile"
        Invoke-WebRequest -Uri $url -OutFile $outFile
        $i++
    }
}

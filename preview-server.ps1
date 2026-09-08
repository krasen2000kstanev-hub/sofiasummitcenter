$root = 'D:\SoffiaSummit\sofiasummitcenter'
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,8765)
$listener.Start()
Write-Output 'ready'
while ($true) {
  $client = $listener.AcceptTcpClient()
  $stream = $client.GetStream()
  $reader = [IO.StreamReader]::new($stream)
  $request = $reader.ReadLine()
  while ($reader.ReadLine() -ne '') { }
  $path = ($request -split ' ')[1].TrimStart('/')
  if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }
  $file = Join-Path $root ([Uri]::UnescapeDataString($path))
  if (Test-Path -LiteralPath $file -PathType Leaf) { $body = [IO.File]::ReadAllBytes($file); $status = '200 OK' } else { $body = [Text.Encoding]::UTF8.GetBytes('Not found'); $status = '404 Not Found' }
  $type = switch ([IO.Path]::GetExtension($file)) { '.html' {'text/html; charset=utf-8'} '.css' {'text/css; charset=utf-8'} '.js' {'text/javascript; charset=utf-8'} '.png' {'image/png'} '.jpg' {'image/jpeg'} default {'application/octet-stream'} }
  $header = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n")
  $stream.Write($header,0,$header.Length); $stream.Write($body,0,$body.Length); $stream.Close(); $client.Close()
}

param(
    [Parameter(Mandatory = $true)][string]$Port,
    [int]$BaudRate = 9600
)
$ErrorActionPreference = 'Stop'
$gpsPort = New-Object System.IO.Ports.SerialPort($Port, $BaudRate)
$gpsPort.ReadTimeout = 1000
$gpsPort.DtrEnable = $false
$gpsPort.RtsEnable = $false
try {
    $gpsPort.Open()
    [Console]::Error.WriteLine("GPS serial open: $Port at $BaudRate. Reading only; no device commands sent.")
    while ($true) {
        try {
            $line = $gpsPort.ReadLine()
            if ($line.Length -le 512) { [Console]::WriteLine($line.Trim()) }
        } catch [System.TimeoutException] { }
    }
} catch {
    [Console]::Error.WriteLine("GPS serial error: " + $_.Exception.Message + ". Close Arduino Serial Monitor or other apps using this port.")
    exit 1
} finally {
    if ($gpsPort.IsOpen) { $gpsPort.Close() }
    $gpsPort.Dispose()
}

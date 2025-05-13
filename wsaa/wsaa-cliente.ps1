# wsaa-cliente-noopenssl.ps1
# Autor: Adaptado del ejemplo original de Gustavo Larriera (AFIP, 2019)

[CmdletBinding()]
Param(
    [Parameter(Mandatory=$True)]
    [string]$Certificado="CERTSOL.pfx",
    [Parameter(Mandatory=$True)]
    [string]$Password="PENDE24",
    [Parameter(Mandatory=$True)]
    [string]$ServicioId="wscdc",
    [Parameter(Mandatory=$False)]
    [string]$WsaaWsdl = "https://wsaa.afip.gov.ar/ws/services/LoginCms?WSDL"
)
Add-Type -AssemblyName System.Security
# Variables dinámicas para fecha y hora
$dtNow = Get-Date
$generationTime = $dtNow.ToString("yyyy-MM-ddTHH:mm:ss")
$expirationTime = $dtNow.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss")

# Generar el archivo XML
$xmlContent = @"
<loginTicketRequest>
  <header>
    <uniqueId>$($dtNow.ToString("yyMMddHHmm"))</uniqueId>
    <generationTime>$generationTime</generationTime>
    <expirationTime>$expirationTime</expirationTime>
  </header>
  <service>wscdc</service>
</loginTicketRequest>
"@
$xmlFilePath = "C:\Users\alang\wsaa\miloginticketrequest.xml"
Set-Content -Path $xmlFilePath -Value $xmlContent -Encoding UTF8
Write-Host "Archivo XML generado en: $xmlFilePath" -ForegroundColor Green

# Verificar existencia del certificado
if (-not (Test-Path $Certificado)) {
    Write-Error "El archivo de certificado '$Certificado' no existe."
    exit 1
}

# Importar el certificado
try {
    $cer = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
    $cer.Import($Certificado, $Password, 0)
} catch {
    Write-Error "Error al importar el certificado: $($_.Exception.Message)"
    exit 1
}

# Firmar el XML y generar el CMS
try {
    $xmlTA = New-Object System.XML.XMLDocument
    $xmlTA.Load($xmlFilePath)
    $msgBytes = [System.Text.Encoding]::UTF8.GetBytes($xmlTA.OuterXml)

    $contentInfo = [System.Security.Cryptography.Pkcs.ContentInfo]::new($msgBytes)
    $signedCms = [System.Security.Cryptography.Pkcs.SignedCms]::new($contentInfo)
    $cmsSigner = [System.Security.Cryptography.Pkcs.CmsSigner]::new([System.Security.Cryptography.Pkcs.SubjectIdentifierType]::IssuerAndSerialNumber, $cer)
    $cmsSigner.IncludeOption = [System.Security.Cryptography.X509Certificates.X509IncludeOption]::EndCertOnly
    $signedCms.ComputeSignature($cmsSigner)
    $signedCmsBase64 = [System.Convert]::ToBase64String($signedCms.Encode())

    Set-Content -Path "C:\Users\alang\wsaa\CMSGenerado.cms" -Value $signedCmsBase64
    Write-Host "CMS generado y guardado correctamente."
} catch {
    Write-Error "Error durante la generación del CMS: $($_.Exception.Message)"
    exit 1
}

# Llamar al servicio loginCms
try {
    $wsaa = New-WebServiceProxy -Uri $WsaaWsdl -ErrorAction Stop
    Write-Host "Intentando loginCms con servicio: $ServicioId"
    $wsaaResponse = $wsaa.loginCms($signedCmsBase64)
    $wsaaResponse > "C:\Users\alang\wsaa\response-log.xml"
    Write-Host "Respuesta del WSAA guardada en response-log.xml"
} catch {
    Write-Error "Error en loginCms: $($_.Exception.Message)"
    exit 1
}

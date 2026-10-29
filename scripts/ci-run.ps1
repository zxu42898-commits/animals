param([Parameter(Mandatory=$true)][ValidateSet('test','test:camera','test:recognition','desktop:package')][string]$Task)
$ErrorActionPreference = 'Continue'
New-Item -ItemType Directory -Force test-results | Out-Null
$log = Join-Path test-results ($Task.Replace(':','-') + '.log')
& npm.cmd run $Task 2>&1 | Tee-Object -FilePath $log
$code = $LASTEXITCODE
if ($code -ne 0) {
  $message = ((Get-Content $log -Tail 50) -join "`n").Replace('%','%25').Replace("`r",'%0D').Replace("`n",'%0A')
  Write-Output "::error title=$Task failed::$message"
}
exit $code

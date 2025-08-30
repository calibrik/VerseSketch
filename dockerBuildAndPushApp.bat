docker build -t sircalibrik/versesketch:webapp-latest .
docker build -t sircalibrik/versesketch:piper-latest ./PiperSetup
docker login
docker push sircalibrik/versesketch:webapp-latest
docker push sircalibrik/versesketch:piper-latest
pause
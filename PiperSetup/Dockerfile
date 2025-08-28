FROM python:3.13-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m pip install piper-tts[http] \
    && python3 -m piper.download_voices en_US-hfc_male-medium \
    && python3 -m piper.download_voices ru_RU-dmitri-medium
EXPOSE 5000
ENTRYPOINT [ "python3", "-m", "piper.http_server", "-m", "en_US-hfc_male-medium" ]
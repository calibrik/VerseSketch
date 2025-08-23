# Build using docker
1. Add ```"JwtConfig:Key":"<any random key>"``` inside the [appsettings.json](VerseSketch.Backend/VerseSketch.Backend/appsettings.json).
2. Check if ```baseURL``` varibale is set to ```location.protocol``` in [ConfigConnection.ts](verseSketch-frontend/src/misc/ConnectionConfig.ts)
3. Then run ```docker copmose up --build``` in terminal to build images and run containers. Server will start on [localhost:80](http://localhost:80).

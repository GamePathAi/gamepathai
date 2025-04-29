
# GamePath AI Desktop App

Este é o aplicativo desktop do GamePath AI construído com Electron.

## Configuração

1. Primeiro, instale as dependências do projeto:
```
npm install
```

2. Adicione os seguintes scripts ao seu package.json:
```json
{
  "scripts": {
    "electron:dev": "concurrently \"cross-env IS_ELECTRON=true vite\" \"electron .\"",
    "electron:build": "vite build && electron-builder",
    "electron:build:win": "vite build && electron-builder --win",
    "electron:build:mac": "vite build && electron-builder --mac",
    "electron:build:linux": "vite build && electron-builder --linux"
  }
}
```

## Desenvolvimento

Para executar o aplicativo em modo de desenvolvimento:

```
npm run electron:dev
```

## Construção para Distribuição

Para construir o aplicativo para diferentes plataformas:

### Windows
```
npm run electron:build:win
```

### macOS
```
npm run electron:build:mac
```

### Linux
```
npm run electron:build:linux
```

Os arquivos de distribuição serão gerados na pasta `release/`.

## Estrutura do Projeto

- `electron/main.js`: Ponto de entrada do Electron
- `electron/preload.js`: Script de pré-carregamento para comunicação segura
- `electron/csp.js`: Configuração de políticas de segurança
- `electron-builder.json`: Configuração de empacotamento

## Notas

- A comunicação entre o processo de renderização e o processo principal é feita através da API de contextBridge.
- No ambiente desktop, algumas funcionalidades como WebAuthn podem ter comportamento diferente.

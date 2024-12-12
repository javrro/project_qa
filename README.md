## Instalación

Deben tener `npm` instalado en su máquina. Para eso, sigan las indicaciones en la siguiente página: [Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

Una vez instalado `npm`, deben ejecutar los siguientes comandos en la consola:

1. Instalar las dependencies:

```
npm install
```

2. Una vez terminan de instalar todas las dependencies, ya pueden levantar el servidor:

```
npm start
```

Este comando creará la base de datos en SQLite (archivo `db.sqlite`) y todas las tablas necesarias.

## Levantar el servidor

Para levantar el servidor, deben ejecutar el siguiente comando:

```
npm start
```

Esto levantará el servidor en el puerto 3000. Para probar las rutas, pueden usar el siguiente comando:

```
curl -X GET http://localhost:3000/api/v1/products -H "Content-Type: application/json"
```

Si no tienen `curl` instalado, pueden utilizar otras herramientas como [Postman](https://www.postman.com/) o [Insomnia](https://insomnia.rest/).

## Pruebas

Para ejecutar las pruebas, deben ejecutar el siguiente comando:

```
npm test
```

Si quieren ver el coverage de las pruebas, pueden ejecutar el siguiente comando:

```
npm run test:coverage
```

## Ejecutar mutation testing con stryker

Para ejecutar mutation testing con stryker, deben ejecutar el siguiente comando:

```
npx stryker run
```

Eso generará un reporte en el archivo `reports/mutation.html` que pueden abrir con cualquier navegador.

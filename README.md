## Available Scripts

In the project directory, you can run:

### `yarn`

Install all the dependencies.

### `yarn dev`

Runs the app in the development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn build-node`

Builds the Node Admin.
Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.


### `yarn build-hub`

Builds the Staking Hub.
Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.



### `docker build -t node-admin -f ./scripts/NodeAdmin.Dockerfile .`

Builds the Node Admin docker image with the name `node-admin`.

### `docker run -p 8080:80 node-admin`

Runs the Node Admin doker image exposing the 8080 port.
To access the Node Admin you should go to `http://localhost:8080/`

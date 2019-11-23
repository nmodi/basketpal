import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

const rootDiv = document.createElement('div');
rootDiv.id = 'root';
document.body.appendChild(rootDiv);
const root = document.getElementById('root');

ReactDOM.render(<App />, root);

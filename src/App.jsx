import React from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';

import './base.css';

const colors = {
    grey: "#cfdbd5",
    plat: "#e8eddf",
    yellow: "#f5cb5c",
    black: "#242423",
    darkgrey: "#333533"
}

const Body = styled.main`
    display: flex;
    justify-content: space-between;
    flex-direction: column;
	justify-content: center;
    min-height: 100vh;
    background: #121212; 
`;


// const GlobalStyle = createGlobalStyle`
//     body {
//         color: ${props => props.theme.copy};
//     }
// `;

const App = () => {
    // const [theme, setTheme] = React.useState(
    //     localStorage.getItem('theme') || 'light'
    // );

    // React.useEffect(() => {
    //     localStorage.setItem('theme', theme);
    // }, [theme]);
    
    return (
        <Body>

        </Body>
    );
};

export default App;

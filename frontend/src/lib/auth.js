import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('telegram_user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    const login = (telegramUser) => {
        localStorage.setItem('telegram_user', JSON.stringify(telegramUser));
        setUser(telegramUser);
    };

    const logout = () => {
        localStorage.removeItem('telegram_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export const TelegramLoginButton = ({ botName }) => {
    const { login } = useAuth();

    useEffect(() => {
        window.onTelegramAuth = (user) => {
            login(user);
        };

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', botName);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');
        script.async = true;

        const container = document.getElementById('telegram-login-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(script);
        }
    }, [botName, login]);

    return <div id="telegram-login-container" />;
};

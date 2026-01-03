import React, { useEffect, useRef } from 'react';

const TelegramLoginButton = ({ botName, onAuth }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        
        // Check if script is already there to prevent duplicates
        if (containerRef.current.querySelector('script')) return;

        const script = document.createElement('script');
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.setAttribute('data-telegram-login', botName);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '8');
        script.setAttribute('data-userpic', 'false');
        script.setAttribute('data-request-access', 'write');
        script.async = true;

        // Callback function name
        const callbackName = 'onTelegramAuth_' + Math.random().toString(36).substring(7);
        script.setAttribute('data-onauth', `${callbackName}(user)`);

        // Define global callback
        window[callbackName] = (user) => {
            if (onAuth) onAuth(user);
        };

        containerRef.current.appendChild(script);

        return () => {
            delete window[callbackName];
        };
    }, [botName, onAuth]);

    return <div ref={containerRef} className="flex justify-center" />;
};

export default TelegramLoginButton;

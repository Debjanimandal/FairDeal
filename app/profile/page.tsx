'use client';

import { useWallet } from '@/components/WalletProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
    const { wallet, userRole } = useWallet();
    const [name, setName] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        // Add custom navbar styling for this page only
        const styleElement = document.createElement('style');
        styleElement.id = 'profile-page-navbar-override';
        styleElement.innerHTML = `
            .navbar {
                background: rgba(11, 16, 38, 0.4) !important;
                backdrop-filter: blur(24px) !important;
                -webkit-backdrop-filter: blur(24px) !important;
                border-bottom: 1px solid rgba(255,255,255,0.1) !important;
            }
            .navbar .logo-container span {
                color: transparent !important;
                background: linear-gradient(to right, #00C6FF, #0072FF) !important;
                -webkit-background-clip: text !important;
                background-clip: text !important;
            }
        `;
        document.head.appendChild(styleElement);

        // Load name from localStorage
        if (wallet) {
            const savedName = localStorage.getItem(`profileName_${wallet}`);
            if (savedName) {
                setName(savedName);
            }
        }

        // Cleanup when leaving the page
        return () => {
            const style = document.getElementById('profile-page-navbar-override');
            if (style) {
                style.remove();
            }
        };
    }, [wallet]);

    const handleSaveName = () => {
        if (wallet) {
            localStorage.setItem(`profileName_${wallet}`, name);
            setIsEditing(false);
        }
    };

    if (!wallet) return (
            <div style={{ 
                minHeight: '100vh', 
                background: 'radial-gradient(ellipse at top, #0B1026 0%, #000000 100%)', 
                color: 'white', 
                paddingTop: '8rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Please connect your wallet</h2>
                </div>
            </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at top, #0B1026 0%, #000000 100%)', // Deep space background
            color: 'white',
            paddingTop: '8rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Ambient Glows */}
            <div style={{
                position: 'absolute',
                top: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(0, 198, 255, 0.1) 0%, transparent 70%)',
                filter: 'blur(100px)',
                zIndex: 0
            }}></div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
                
                {/* Profile Header */}
                <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px', 
                    padding: '3rem',
                    marginBottom: '4rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem'
                }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        color: 'white'
                    }}>
                        {name ? name.charAt(0).toUpperCase() : (userRole === 'client' ? 'C' : 'F')}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ 
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            background: userRole === 'client' ? 'rgba(0, 198, 255, 0.2)' : 'rgba(225, 0, 255, 0.2)',
                            color: userRole === 'client' ? '#00C6FF' : '#E100FF',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            textTransform: 'capitalize'
                        }}>
                            {userRole} Account
                        </div>
                        
                        <div style={{ marginBottom: '0.5rem' }}>
                            {isEditing ? (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name"
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.3)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '8px',
                                            padding: '0.5rem 1rem',
                                            color: 'white',
                                            fontSize: '1.5rem',
                                            fontWeight: '700',
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                            maxWidth: '300px'
                                        }}
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleSaveName}
                                        style={{
                                            background: '#00C6FF',
                                            color: 'black',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '0.5rem 1rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h1 style={{ fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>
                                        {name || (userRole === 'client' ? 'Client Profile' : 'Freelancer Profile')}
                                    </h1>
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '8px',
                                            padding: '0.4rem 0.8rem',
                                            color: '#94A3B8',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.875rem',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#94A3B8';
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                        Edit Name
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ 
                            fontFamily: 'monospace', 
                            color: '#94A3B8', 
                            background: 'rgba(0, 0, 0, 0.3)', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{ color: '#64748B' }}>Wallet:</span>
                            <span>{wallet}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

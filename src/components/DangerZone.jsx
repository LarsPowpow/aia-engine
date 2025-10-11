// FILE: src/components/DangerZone.jsx
import React, { useState, useEffect } from 'react';

const DangerZone = ({ onClearUkb, onClearArchive, addLog }) => {
    const [purgeTarget, setPurgeTarget] = useState(null); // null, 'ukb', or 'archive'
    const [confirmationState, setConfirmationState] = useState(0); // 0: idle, 1: confirm, 2: countdown, 3: armed
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        let intervalId;
        if (confirmationState === 2) {
            intervalId = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [confirmationState]);

    useEffect(() => {
        if (countdown <= 0) {
            setConfirmationState(3); // Arm the final button
        }
    }, [countdown]);


    const handleInitialClick = (target) => {
        setPurgeTarget(target);
        setConfirmationState(1);
    };

    const handleCancel = () => {
        setPurgeTarget(null);
        setConfirmationState(0);
        setCountdown(3);
        addLog('info', 'Clean Slate operation cancelled.');
    };

    const handleConfirm = () => {
        setConfirmationState(2); // Start countdown
    };

    const handleExecute = () => {
        if (purgeTarget === 'ukb') {
            onClearUkb();
        } else if (purgeTarget === 'archive') {
            onClearArchive();
        }
        handleCancel(); // Reset state after execution
    };

    const renderButtons = () => {
        if (confirmationState === 0) {
            return (
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleInitialClick('archive')} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg text-sm">
                        Clean Slate: Dirty JSON
                    </button>
                    <button onClick={() => handleInitialClick('ukb')} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg text-sm">
                        Clean Slate: UKB
                    </button>
                </div>
            );
        }

        const targetLabel = purgeTarget === 'ukb' ? 'UKB (abilities, effects)' : 'Dirty JSON Archive';

        if (confirmationState === 1) {
            return (
                <div className="flex flex-col space-y-2">
                    <p className="text-center text-red-400 mb-2">Purge <span className="font-bold">{targetLabel}</span>? This is permanent.</p>
                    <button onClick={handleConfirm} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg transition">Confirm Purge Request</button>
                    <button onClick={handleCancel} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded-lg transition text-xs">Cancel</button>
                </div>
            );
        }

        if (confirmationState === 2) { // Countdown
            return (
                <div className="flex flex-col space-y-2">
                     <p className="text-center text-yellow-400 font-bold mb-2">FINAL WARNING</p>
                    <button className="w-full bg-gray-700 border border-gray-600 text-gray-400 font-bold py-3 px-5 rounded-lg text-lg transition cursor-not-allowed" disabled>
                        Executing in {countdown}...
                    </button>
                    <button onClick={handleCancel} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded-lg transition text-xs">Cancel</button>
                </div>
            )
        }
        
        if (confirmationState === 3) { // Armed
             return (
                <div className="flex flex-col space-y-2">
                     <p className="text-center text-red-500 font-bold mb-2">ARMED - FINAL CONFIRMATION</p>
                    <button onClick={handleExecute} className="w-full bg-red-900 hover:bg-red-800 border border-red-500 text-white font-bold py-3 px-5 rounded-lg text-lg transition animate-pulse">
                        EXECUTE PURGE
                    </button>
                    <button onClick={handleCancel} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded-lg transition text-xs">Cancel</button>
                </div>
            )
        }
    };

    return (
        <div className="pt-4 border-t border-red-500/30 mt-4">
            <h4 className="text-lg font-semibold text-red-400 mb-2 text-center">Danger Zone</h4>
            {renderButtons()}
        </div>
    );
};

export default DangerZone;
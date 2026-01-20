import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const VerificationScreen = ({ onVerificationComplete }) => {
  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [dots, setDots] = useState('');
  const [verificationData, setVerificationData] = useState(null);

  useEffect(() => {
    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    // Run verification
    const verify = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Show verification for at least 1.5s
        
        const response = await axios.get('http://localhost:5000/api/verify-integrity');
        setVerificationData(response.data);
        
        if (response.data.authentic) {
          setStatus('success');
          // Proceed after a brief success message
          setTimeout(() => {
            onVerificationComplete(true);
          }, 800);
        } else {
          setStatus('failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('failed');
        setVerificationData({
          authentic: false,
          message: 'Could not connect to verification service'
        });
      }
    };

    verify();

    return () => clearInterval(dotsInterval);
  }, [onVerificationComplete]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Spinner */}
          <motion.div
            className="w-16 h-16 mx-auto mb-6 border-4 border-purple-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Verifying codes{dots}
          </h2>
          <p className="text-gray-400">
            Checking authentication signatures
          </p>
        </motion.div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          
          <h2 className="text-2xl font-bold text-green-400 mb-2">
            Verification Successful
          </h2>
          <p className="text-gray-400">
            Authentication confirmed ✓
          </p>
        </motion.div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center p-8">
        <motion.div
          className="max-w-2xl w-full bg-gray-800 rounded-lg border-2 border-red-500 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Warning Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-red-400 mb-4 text-center">
            ⚠️ Code Verification Failed
          </h2>
          
          <div className="bg-red-900 bg-opacity-30 rounded-lg p-6 mb-6 border border-red-500">
            <p className="text-white mb-4">
              <strong>Authentication signatures are missing or modified.</strong>
            </p>
            <p className="text-gray-300 mb-4">
              This may indicate that the code has been copied without proper attribution or tampered with.
            </p>
            
            {verificationData && (
              <div className="text-sm text-gray-400 mb-4">
                <p>Signatures found: {verificationData.signatures_found} / {verificationData.signatures_expected}</p>
                {verificationData.missing_signatures && verificationData.missing_signatures.length > 0 && (
                  <p className="mt-2">Missing: {verificationData.missing_signatures.join(', ')}</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-700 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-3">📢 Important Information</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span><strong>Original Creators:</strong> WinandMe & Ilfaust-Rembrandt</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>
                  <strong>Official Repository:</strong>{' '}
                  <a 
                    href="https://github.com/WinandMe/UmaRacingWeb" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    UmaRacingWeb
                  </a>
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span><strong>Fan Project For:</strong> Uma Musume Pretty Derby (© Cygames)</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">⚠</span>
                <span><strong>This copy may be unauthorized</strong></span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-900 bg-opacity-30 rounded-lg p-6 border border-purple-500">
            <h3 className="text-lg font-bold text-purple-400 mb-3">What should you do?</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
              <li>Verify you downloaded from the official repository</li>
              <li>If you're the creator, check if signatures were accidentally removed</li>
              <li>If someone gave you this, ask them for the legitimate source</li>
              <li>Contact WinandMe or Ilfaust-Rembrandt if you have questions</li>
            </ol>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Authentication Hash: URS-VERIFICATION-2026-WMIRQ
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default VerificationScreen;

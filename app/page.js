"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModelViewer from './ModelViewer';
import NavigationButton from "./NavigationButton";
import Image from 'next/image'; // Added import for Next.js Image component

// API base URL - make it easy to change for development/production
const API_BASE_URL = 'http://127.0.0.1:5000';

function App() {
  const [niftiFile, setNiftiFile] = useState(null);
  const [maskFile, setMaskFile] = useState(null);
  const [gifUrls, setGifUrls] = useState({
    axial: null,
    sagittal: null,
    coronal: null,
  });
  const [modelUrls, setModelUrls] = useState({});
  const [activeModelUrl, setActiveModelUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [activeTab, setActiveTab] = useState('gifs');
  
  // New states for modern UI features
  const [introComplete, setIntroComplete] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(true);
  // State for particles - initially empty
  const [particles, setParticles] = useState([]);

  // Modified: No automatic timeout for the intro animation
  // Instead, we'll wait for user click

  // Generate particles only on client-side
  useEffect(() => {
    const newParticles = Array.from({ length: 200 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1, // tiny size (1px to 4px)
      left: Math.random() * 100,  // % of container width
      top: Math.random() * 100,   // % of container height
      duration: Math.random() * 60 + 30, // animation duration in seconds
      delay: Math.random() * 30   // delay before animation starts
    }));
  
    setParticles(newParticles);
  }, []);
  

  // Handle closing the welcome overlay on click
  const handleWelcomeOverlayClick = () => {
    setShowWelcomeOverlay(false);
    setTimeout(() => {
      setIntroComplete(true);
    }, 1000);
  };

  const handleNiftiFileChange = (e) => {
    setNiftiFile(e.target.files[0]);
  };

  const handleMaskFileChange = (e) => {
    setMaskFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setGifUrls({ axial: null, sagittal: null, coronal: null });
    setModelUrls({});
    setActiveModelUrl(null);

    if (!niftiFile) {
      setError('Please upload a NIfTI file.');
      return;
    }

    const formData = new FormData();
    formData.append('nifti_file', niftiFile);
    if (maskFile) {
      formData.append('mask_file', maskFile);
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/create_gif`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('GIF Response:', response.data);
      setGifUrls(response.data);
      
      // Now request 3D models
      const modelResponse = await axios.post(`${API_BASE_URL}/create_3d`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('3D Model Response:', modelResponse.data);
      const models = modelResponse.data.models || {};
      setModelUrls(models);
      
      // Set the first model as active if any are available
      const modelKeys = Object.keys(models);
      if (modelKeys.length > 0) {
        setActiveModelUrl(models[modelKeys[0]]);
      }

      // Verify the GIFs are accessible - debugging
      for (const key in response.data) {
        try {
          await axios.head(response.data[key]);
          console.log(`${key} GIF URL is accessible`);
        } catch (error) {
          console.warn(`${key} GIF URL might not be accessible yet:`, error);
        }
      }
    } catch (error) {
      console.error('Error creating visualizations:', error);
      setError(
        error.response?.data?.error ||
        'Failed to create visualizations. Check console for details.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDebugInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/debug`);
      setDebugInfo(response.data);
      setShowDebug(true);
    } catch (error) {
      console.error('Error fetching debug info:', error);
      setError('Failed to fetch debug information');
    }
  };

  const handleModelSelect = (url) => {
    setActiveModelUrl(url);
  };

  return (
<div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-purple-950 text-white overflow-hidden">

{/* Welcome overlay with animation - modified to include brain scan MP4 */}
{!introComplete && (
  <div 
    className={`fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center transition-all duration-1000 ease-in-out ${
      showWelcomeOverlay ? 'opacity-70' : 'opacity-0 translate-y-full'
    }`}
    onClick={handleWelcomeOverlayClick}
  >
    {/* Semi-transparent overlay for brain scan video */}
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Brain scan with improved rendering while keeping size */}
      <div className="relative w-full max-w-8xl aspect-square animate-pulse-slow">
          <video
          src="/brain.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain opacity-70"
        >
        </video>
        {/* Enhanced glow effect for better visualization */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full filter blur-3xl"></div>
      </div>
    </div>
    
    <div className="text-center space-y-4 relative z-10">
      <h1 className="text-9xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 drop-shadow-lg">✦</h1>
      <h2 className="text-8xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 drop-shadow-md">
        Deep Voxel
      </h2>
      <p className="text-xl text-blue-200 animate-pulse">Transforming Neuroimaging</p>
      
      {/* Explore button with purple glow effect */}
      <button 
        className="mt-8 px-8 py-3 bg-purple-700 text-white text-lg font-semibold rounded-full transform transition-all duration-300 hover:scale-105 relative group"
        onClick={handleWelcomeOverlayClick}
      >
        {/* Purple glow effect */}
        <div className="absolute inset-0 rounded-full bg-purple-600 opacity-0 group-hover:opacity-100 blur-md -z-10 transition-opacity duration-300 animate-pulse"></div>
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 opacity-70 blur-md -z-10"></div>
        Explore
      </button>
    </div>
  </div>
)}

      {/* Floating particles background effect - Now client-side only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
  {particles.map(particle => (
    <div 
      key={particle.id}
      className="absolute rounded-full bg-white opacity-80 animate-float"
      style={{
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        left: `${particle.left}%`,
        top: `${particle.top}%`,
        animationDuration: `${particle.duration}s`,
        animationDelay: `${particle.delay}s`,
        boxShadow: '0 0 6px 2px rgba(255, 255, 255, 0.4)' // glowing effect
      }}
    ></div>
  ))}
</div>


      <div className="relative max-w-6xl mx-auto px-5 py-10">
        {/* Header */}
        <header className={`mb-12 transform transition-all duration-1000 ease-out ${
          introComplete ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-400 to-pink-500">
              Deep Voxel
            </span>
          </h1>
          <p className="text-center text-lg text-blue-200/80 max-w-2xl mx-auto">
            Transform your neuroimaging data into interactive visualizations with our modern toolset
          </p>
        </header>

        {/* Main content */}
        <div className={`transform transition-all duration-1000 ease-out delay-300 ${
          introComplete ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}>
          
          {/* Main card with backdrop blur */}
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            
            {/* Debug info panel */}
            {showDebug && debugInfo && (
              <div className="mb-8 bg-black/50 backdrop-blur-lg rounded-xl p-4 text-xs overflow-auto relative mx-8 mt-8">
                <button
                  onClick={() => setShowDebug(false)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/70 flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  ×
                </button>
                <h3 className="font-bold mb-2 text-blue-300">Server Debug Info:</h3>
                <pre className="text-blue-100/70">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mx-8 mt-8 mb-6 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 px-6 py-4 rounded-xl">
                {error}
              </div>
            )}

            {/* File upload form */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="relative group">
                    <label className="block mb-3 text-blue-300 font-medium text-lg">NIfTI File</label>
                    <div className="relative">
                      <input
                        type="file"
                        id="nifti-file"
                        onChange={handleNiftiFileChange}
                        accept=".nii,.nii.gz"
                        required
                        className="hidden"
                      />
                      <label
                        htmlFor="nifti-file"
                        className="flex items-center w-full cursor-pointer border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 backdrop-blur-sm rounded-xl px-5 py-4 transition-all group-hover:shadow-lg group-hover:shadow-blue-500/20"
                      >
                        <div className="mr-4 w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300 group-hover:text-blue-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="flex-1 truncate">
                          {niftiFile ? niftiFile.name : "Upload NIfTI file"}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="block mb-3 text-purple-300 font-medium text-lg">Mask File</label>
                    <div className="relative">
                      <input
                        type="file"
                        id="mask-file"
                        onChange={handleMaskFileChange}
                        accept=".nii,.nii.gz"
                        className="hidden"
                      />
                      <label
                        htmlFor="mask-file"
                        className="flex items-center w-full cursor-pointer border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 backdrop-blur-sm rounded-xl px-5 py-4 transition-all group-hover:shadow-lg group-hover:shadow-purple-500/20"
                      >
                        <div className="mr-4 w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300 group-hover:text-purple-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="flex-1 truncate">
                          {maskFile ? maskFile.name : "Upload mask file"}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all shadow-lg shadow-blue-700/30 disabled:opacity-70 flex items-center justify-center text-lg font-medium"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : 'Generate Visualizations'}
                  </button>
                  
                  <div className="flex justify-center mt-4">
                    <NavigationButton />
                  </div>
                  
                  <div className="bg-black/30 rounded-xl p-5 backdrop-blur-md">
                    <h3 className="text-lg font-medium text-blue-200 mb-2">How it works</h3>
                    <p className="text-blue-100/70 text-sm">
                      Upload your NIfTI file to generate interactive 3D models and GIF slices for better visualization.
                      Add a mask file to highlight specific regions in your neuroimaging data.
                    </p>
                  </div>
                </div>
              </div>
            </form>

            {/* Loading state */}
            {loading && (
              <div className="mx-8 mb-8 text-center p-10 bg-black/30 backdrop-blur-md rounded-xl border border-white/5">
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute w-full h-full rounded-full border-t-4 border-blue-500 animate-spin"></div>
                    <div className="absolute w-full h-full rounded-full border-l-4 border-purple-500 animate-ping opacity-30"></div>
                    <div className="absolute w-full h-full rounded-full border-b-4 border-pink-500 animate-pulse opacity-50"></div>
                  </div>
                  <p className="text-xl font-medium text-blue-200 mb-2">Generating your visualizations</p>
                  <p className="text-blue-300/60 text-sm">This may take a moment depending on file size</p>
                </div>
              </div>
            )}

            {/* Results section */}
            {(gifUrls.axial || Object.keys(modelUrls).length > 0) && !loading && (
              <div className="mx-8 mb-8 bg-black/40 backdrop-blur-2xl rounded-xl overflow-hidden shadow-2xl border border-white/10">
                <div className="px-8 py-6 border-b border-gray-700/30">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                    Visualization Results
                  </h2>
                  
                  <div className="flex mt-6 border-b border-gray-700/30 pb-4">
                    <button 
                      onClick={() => setActiveTab('gifs')}
                      className={`relative py-3 px-6 rounded-lg transition-all ${
                        activeTab === 'gifs' 
                          ? 'text-white' 
                          : 'text-blue-300 hover:text-white'
                      }`}
                    >
                      {activeTab === 'gifs' && (
                        <span className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 rounded-lg backdrop-blur-sm animate-pulse"></span>
                      )}
                      <span className="relative">GIF Visualization</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('models')}
                      className={`relative py-3 px-6 rounded-lg transition-all ${
                        activeTab === 'models' 
                          ? 'text-white' 
                          : 'text-purple-300 hover:text-white'
                      }`}
                    >
                      {activeTab === 'models' && (
                        <span className="absolute inset-0 bg-gradient-to-r from-purple-600/40 to-pink-600/40 rounded-lg backdrop-blur-sm animate-pulse"></span>
                      )}
                      <span className="relative">3D Model</span>
                    </button>
                  </div>
                </div>
                
{/* GIFs Tab Content */}
{activeTab === 'gifs' && (
  <div className="p-8 grid grid-cols-1 gap-6">
    {Object.entries(gifUrls).map(([orientation, url]) => (
      url && (
        <div key={orientation} className="overflow-hidden rounded-xl bg-black/20 backdrop-blur-md p-4 hover:shadow-xl hover:shadow-blue-900/20 transition-all group">
          <h3 className="text-lg font-semibold mb-3 capitalize text-blue-200 group-hover:text-blue-100 transition-colors">
            {orientation}
          </h3>
          <div className="rounded-lg overflow-hidden border border-white/10">
            <img
              src={url}
              alt={`Generated ${orientation} GIF`}
              className="w-full max-h-[50vh] object-contain rounded-lg transform group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                console.error(`Image failed to load: ${url}`);
                e.target.style.display = 'none';
                setError(`Failed to load image at ${url}. The GIF may not have been created properly.`);
              }}
            />
          </div>
        </div>
      )
    ))}
  </div>
)}

                
                {/* 3D Models Tab Content */}
                {activeTab === 'models' && (
                  <div className="p-8">
                    {Object.keys(modelUrls).length > 0 ? (
                      <div className="space-y-8">
                        {/* 3D Model Viewer */}
                        {activeModelUrl && (
                          <div className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-purple-500/20">
                            <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-200">
                              Interactive 3D Model
                            </h3>
                            <div className="rounded-lg overflow-hidden border border-purple-500/20 shadow-lg shadow-purple-500/10">
                              <ModelViewer modelUrl={activeModelUrl} />
                            </div>
                          </div>
                        )}
                        
                        {/* Model selection */}
                        <div className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-purple-500/20">
                          <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-200">
                            Available Models
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(modelUrls).map(([modelType, url]) => (
                              <div 
                                key={modelType} 
                                className={`group bg-gradient-to-br ${
                                  activeModelUrl === url 
                                    ? 'from-purple-900/50 to-indigo-900/50 ring-2 ring-purple-500' 
                                    : 'from-black/40 to-purple-900/20 hover:from-purple-900/30 hover:to-indigo-900/30'
                                } p-5 rounded-lg transition-all cursor-pointer`}
                                onClick={() => handleModelSelect(url)}
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-medium capitalize text-purple-100 group-hover:text-white transition-colors">
                                    {modelType.replace(/_/g, ' ')}
                                  </h4>
                                  
                                  {activeModelUrl === url && (
                                    <span className="text-xs bg-purple-500/30 px-2 py-1 rounded-full text-purple-200">
                                      Active
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                  <a
                                    href={url}
                                    download
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs bg-blue-600/30 hover:bg-blue-600/50 text-white px-3 py-1.5 rounded-full inline-flex items-center transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-6 bg-purple-900/10 p-4 rounded-lg border border-purple-500/10">
                            <p className="text-sm text-gray-400">
                              These models are in PLY format. View them interactively above, 
                              or download to use with software like Blender or MeshLab.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <p className="text-gray-400">No 3D models were generated.</p>
                        <p className="text-sm text-gray-500 mt-2">Try with a different NIfTI file or adjust parameters.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-50 text-center text-gray-50 text-sm opacity-70">
          <p>
            &copy; {new Date().getFullYear()} ✦ Deep Voxel • Advanced Neuroimaging • North South University
          </p>
        </footer>
      </div>

      {/* Add global animation styles */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0) rotate(0);
            opacity: 0.05;
          }
          50% {
            transform: translateY(-20px) translateX(10px) rotate(5deg);
            opacity: 0.1;
          }
          100% {
            transform: translateY(0) translateX(0) rotate(0);
            opacity: 0.05;
          }
        }
        .animate-float {
          animation: float 15s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default App;

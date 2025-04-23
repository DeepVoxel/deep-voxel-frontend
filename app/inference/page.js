'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BrainCircuit, ImagePlus, List } from 'lucide-react';

export default function BrainTumorSegmentation() {
  const [sampleId, setSampleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Fetch dataset info when component mounts
    // fetch('http://localhost:5001/dataset_info')
    fetch('https://deep-voxel-backend.onrender.com/dataset_info')
      .then(response => response.json())
      .then(data => {
        setDatasetInfo(data);
        if (data.total_samples > 0) {
          setSampleId('0'); // Default to first sample
        }
      })
      .catch(err => {
        console.error('Error fetching dataset info:', err);
        setError('Failed to load dataset information. Please ensure the backend server is running.');
      });
  }, []);

  const handleSampleIdChange = (e) => {
    setSampleId(e.target.value);
  };

  const handleSelectChange = (value) => {
    setSampleId(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // const response = await fetch('http://localhost:5001/process_sample', {
        const response = await fetch('https://deep-voxel-backend.onrender.com/process_sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: parseInt(sampleId) }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        setActiveTab('overview'); // Reset to overview tab
      } else {
        setError(data.error || 'Failed to process sample');
      }
    } catch (err) {
      console.error('Error processing sample:', err);
      setError('Failed to connect to server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-white bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200">Real-time Segmentation</h1>
          <p className="text-gray-400">View segmentation results from the SwinUNETR model on BRATS 2023 data</p>
        </div>

        <Card className="mb-8 bg-gray-900/80 border-purple-900/50 backdrop-blur-lg shadow-xl">
          <CardHeader className="border-b border-purple-900/50">
            <CardTitle className="flex items-center text-purple-300">
              <BrainCircuit className="mr-2 text-purple-400" size={24} />
              Select a Sample
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sample-id" className="text-gray-300">Sample ID</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="sample-id"
                      type="number" 
                      value={sampleId} 
                      onChange={handleSampleIdChange}
                      min={0}
                      max={datasetInfo?.total_samples ? datasetInfo.total_samples - 1 : 0}
                      className="flex-1 bg-gray-800 border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-purple-700 hover:bg-purple-600 text-white shadow-lg transition-all relative overflow-hidden group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></span>
                      <span className="absolute inset-0 rounded-md shadow-[0_0_15px_rgba(147,51,234,0.5)] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing
                        </>
                      ) : (
                        'View Results'
                      )}
                    </Button>
                  </div>
                  {datasetInfo && (
                    <p className="text-sm text-gray-400 mt-1">
                      Enter a number between 0 and {datasetInfo.total_samples - 1}
                    </p>
                  )}
                </div>
                
                {datasetInfo && datasetInfo.sample_filenames && (
                  <div>
                    <Label htmlFor="sample-select" className="text-gray-300">Or select by name</Label>
                    <Select onValueChange={handleSelectChange} value={sampleId}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select a sample" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        {datasetInfo.sample_filenames.map((name, index) => (
                          <SelectItem key={index} value={index.toString()} className="hover:bg-purple-900/30">
                            {name} (ID: {index})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-8 border-red-800/50 bg-gray-900/80 backdrop-blur-lg shadow-xl">
            <CardContent className="pt-6">
              <div className="bg-red-900/30 text-red-300 p-4 rounded-md border border-red-800/50">
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="bg-gray-900/80 border-purple-900/50 backdrop-blur-lg shadow-xl">
            <CardHeader className="border-b border-purple-900/50">
              <CardTitle className="text-purple-300">
                Segmentation Results for Sample #{result.sample_id}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="mb-4 bg-gray-800 p-1">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity"></span>
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="perClass" 
                    className="data-[state=active]:bg-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity"></span>
                    <List className="mr-2 h-4 w-4" />
                    Per-Class View
                  </TabsTrigger>
                  <TabsTrigger 
                    value="modalities" 
                    className="data-[state=active]:bg-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity"></span>
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    MRI Modalities
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-0">
                  <div className="bg-black rounded-lg overflow-hidden border border-purple-900/30 shadow-inner">
                    <img 
                      src={`data:image/png;base64,${result.images.overview}`} 
                      alt="Overview segmentation comparison" 
                      className="w-full object-contain"
                    />
                  </div>
                  <div className="mt-2 text-center text-sm text-gray-400">
                    Displaying slice {result.slice_info.current} of {result.slice_info.total}
                  </div>
                </TabsContent>
                
                <TabsContent value="perClass" className="mt-0">
                  <div className="bg-black rounded-lg overflow-hidden border border-purple-900/30 shadow-inner">
                    <img 
                      src={`data:image/png;base64,${result.images.per_class}`} 
                      alt="Per-class segmentation comparison" 
                      className="w-full object-contain"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="modalities" className="mt-0">
                  <div className="bg-black rounded-lg overflow-hidden border border-purple-900/30 shadow-inner">
                    <img 
                      src={`data:image/png;base64,${result.images.modalities}`} 
                      alt="MRI modalities" 
                      className="w-full object-contain"
                    />
                  </div>
                  <div className="mt-4 px-4 bg-gray-900/50 p-4 rounded-lg border border-purple-900/20">
                    <h3 className="font-medium mb-2 text-purple-300">Modality Information:</h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li><strong className="text-purple-200">T1C:</strong> T1-weighted MRI with contrast enhancement</li>
                      <li><strong className="text-purple-200">T1N:</strong> Native T1-weighted MRI</li>
                      <li><strong className="text-purple-200">T2F:</strong> T2-FLAIR MRI</li>
                      <li><strong className="text-purple-200">T2W:</strong> T2-weighted MRI</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
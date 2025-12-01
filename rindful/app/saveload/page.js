'use client';

import colors, { tw } from '@/utils/colors.js';
import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, FileDown, FileJson } from 'lucide-react';
import { importFromFile, validateImportFile } from '@/utils/importData';
import { downloadCSV, downloadJSON } from '@/utils/exportData';

const ImportExportPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [overwrite, setOverwrite] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [activeTab, setActiveTab] = useState('import');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setValidation(null);
    setImportResults(null);

    try {
      // validation
        const result = await validateImportFile(file);
        setValidation(result);
    } catch (error) {
      setValidation({ valid: false, error: error.message });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setProgress({ current: 0, total: validation.entryCount, status: '' });

    // Simulate import process (in real app, import importFromFile)
    try {
      const results = await importFromFile(selectedFile, {
        overwrite: overwrite,
        onProgress: (current, total, status) => {
            setProgress({ current, total, status });
        }
      });

      setImportResults(results);
      setImporting(false);
      
    } catch (error) {
      setImportResults({ error: error.message });
      setImporting(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
        if (format === 'csv') {
            await downloadCSV('journal_entries.csv');
        } else if (format === 'json') {
            await downloadJSON('journal_entries.json');
        }
        console.log(`Exporting as ${format}`);
        setExporting(false);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed: ' + error.message);
        setExporting(false);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setValidation(null);
    setImportResults(null);
    setProgress({ current: 0, total: 0, status: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div style={{ backgroundColor: colors.primary.bg }} className={`min-h-screen p-6`}>
      <div className={`max-w-3xl mx-auto`}>
        {/* Header */}
        <div className={`mb-8`}>
          <h1 className={`text-3xl font-bold ${tw.text.primary} mb-2`}>Import & Export Journal</h1>
          <p className={`${tw.text.secondary}`}>Backup your entries or restore from a previous export</p>
        </div>

        {/* Tab Navigation */}
        <div className={`bg-white rounded-lg shadow-lg overflow-hidden`}>
          <div className={`flex border-b border-gray-200`}>
            <button
              onClick={() => {
                setActiveTab('import');
                resetImport();
              }}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'import'
                  ? `${tw.button.ghost} ${tw.text.light} border-b-2 ${tw.border.primary}`
                  : `${tw.text.light} hover:bg-gray-50`
              }`}
            >
              <Upload className={`w-5 h-5 inline-block mr-2`} />
              Import
            </button>
            <button
              onClick={() => {
                setActiveTab('export');
                resetImport();
              }}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'export'
                  ? `${tw.button.ghost} ${tw.text.light} border-b-2 ${tw.border.primary}`
                  : `${tw.text.light} hover:bg-gray-50`
              }`}
            >
              <Download className={`w-5 h-5 inline-block mr-2`} />
              Export
            </button>
          </div>

          <div className={`p-8`}>
            {/* IMPORT TAB */}
            {activeTab === 'import' && (
              <>
                {/* File Upload Section */}
                {!selectedFile && !importResults && (
                  <div className={`space-y-6`}>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed border-gray-300 rounded-lg p-12 text-center  hover:${tw.button.light} transition-all cursor-pointer`}
                    >
                      <Upload className={`w-16 h-16 mx-auto ${tw.text.light} mb-4`} />
                      <p className={`text-lg font-medium ${tw.text.quaternary} mb-2`}>
                        Click to upload or drag and drop
                      </p>
                      <p className={`text-sm ${tw.text.tertiary}`}>CSV or JSON files only</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.json"
                        onChange={handleFileSelect}
                        className={`hidden`}
                      />
                    </div>

                    {/* Info Box */}
                    <div className={`${tw.bg.main2} border ${tw.border.secondary} rounded-lg p-4`}>
                      <div className={`flex items-start gap-3`}>
                        <AlertCircle className={`w-5 h-5 ${tw.text.emerald} mt-0.5 flex-shrink-0`} />
                        <div className={`text-sm ${tw.text.emerald}`}>
                          <p className={`font-medium mb-1`}>File Format Requirements:</p>
                          <ul className={`list-disc list-inside space-y-1 ${tw.text.emerald}`}>
                            <li>CSV files must have Date and Content columns</li>
                            <li>JSON files must be an array of entry objects</li>
                            <li>Date format: YYYY-MM-DD</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Validation & Options */}
                {selectedFile && !importing && !importResults && (
                  <div className={`space-y-6`}>
                    {/* File Info */}
                    <div className={`bg-gray-50 rounded-lg p-4`}>
                      <div className={`flex items-center gap-3 mb-4`}>
                        <FileText className={`w-8 h-8 ${tw.text.emerald}`} />
                        <div className={`flex-1`}>
                          <p className={`font-medium ${tw.text.primary}`}>{selectedFile.name}</p>
                          <p className={`text-sm ${tw.text.tertiary}`}>{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                          onClick={resetImport}
                          className={`text-sm ${tw.text.secondary} hover:${tw.text.primary}`}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Validation Results */}
                      {validation && validation.valid && (
                        <div className={`border-t border-gray-200 pt-4 space-y-2`}>
                          <div className={`flex justify-between text-sm`}>
                            <span className={`${tw.text.secondary}`}>Entries Found:</span>
                            <span className={`font-medium ${tw.text.primary}`}>{validation.entryCount}</span>
                          </div>
                          <div className={`flex justify-between text-sm`}>
                            <span className={`${tw.text.secondary}`}>Date Range:</span>
                            <span className={`font-medium ${tw.text.primary}`}>
                              {validation.dateRange.earliest} to {validation.dateRange.latest}
                            </span>
                          </div>
                        </div>
                      )}

                      {validation && !validation.valid && (
                        <div className={`border-t border-red-200 pt-4`}>
                          <div className={`flex items-center gap-2 text-red-600`}>
                            <XCircle className={`w-5 h-5`} />
                            <span className={`text-sm font-medium`}>{validation.error}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Import Options */}
                    {validation && validation.valid && (
                      <>
                        <div className={`space-y-3`}>
                          <label className={`flex items-center gap-3 cursor-pointer`}>
                            <input
                              type="checkbox"
                              checked={overwrite}
                              onChange={(e) => setOverwrite(e.target.checked)}
                              className={`checked:bg-emerald-600 w-4 h-4 ${tw.text.emerald} rounded focus:ring-3 ${tw.ring.green}`}
                            />
                            <div>
                              <span className={`text-sm font-medium ${tw.text.quaternary}`}>
                                Overwrite existing entries
                              </span>
                              <p className={`text-xs ${tw.text.tertiary}`}>
                                Replace entries with matching dates. Otherwise, existing entries will be skipped.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* Action Buttons */}
                        <div className={`flex gap-3 pt-2`}>
                          <button
                            onClick={handleImport}
                            className={`flex-1 py-3 px-6 ${tw.button.primary}`}
                          >
                            Import {validation.entryCount} Entries
                          </button>
                          <button
                            onClick={resetImport}
                            className={`px-6 py-3 border border-gray-300 rounded-lg font-medium ${tw.text.quaternary} hover:bg-gray-50 transition-colors`}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Import Progress */}
                {importing && (
                  <div className={`space-y-6`}>
                    <div className={`text-center`}>
                      <div className={`inline-block animate-spin rounded-full h-12 w-12 border-4 ${tw.border.secondary} mb-4`}></div>
                      <p className={`text-lg font-medium ${tw.text.primary}`}>Importing entries...</p>
                      <p className={`text-sm ${tw.text.secondary} mt-2`}>
                        {progress.current} of {progress.total} entries processed
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className={`w-full bg-gray-200 rounded-full h-3 overflow-hidden`}>
                      <div
                        className={`${tw.bg.secondary} h-full transition-all duration-300 ease-out`}
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Import Results */}
                {importResults && !importResults.error && (
                  <div className={`space-y-6`}>
                    <div className={`text-center`}>
                      <CheckCircle className={`w-16 h-16 text-green-500 mx-auto mb-4`} />
                      <h2 className={`text-2xl font-bold ${tw.text.primary} mb-2`}>Import Complete!</h2>
                      <p className={`${tw.text.secondary}`}>Your journal entries have been imported</p>
                    </div>

                    {/* Results Summary */}
                    <div className={`grid grid-cols-3 gap-4`}>
                      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 text-center`}>
                        <p className={`text-2xl font-bold text-green-700`}>{importResults.imported}</p>
                        <p className={`text-sm text-green-600`}>Imported</p>
                      </div>
                      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center`}>
                        <p className={`text-2xl font-bold text-yellow-700`}>{importResults.skipped}</p>
                        <p className={`text-sm text-yellow-600`}>Skipped</p>
                      </div>
                      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 text-center`}>
                        <p className={`text-2xl font-bold text-red-700`}>{importResults.failed}</p>
                        <p className={`text-sm text-red-600`}>Failed</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className={`flex gap-3`}>
                      <button
                        onClick={resetImport}
                        className={`flex-1 ${tw.bg.secondary} ${tw.text.white} py-3 px-6 rounded-lg font-medium ${tw.button.secondary} transition-colors`}
                      >
                        Import Another File
                      </button>
                      <button
                        onClick={() => window.close()}
                        className={`px-6 py-3 border border-gray-300 rounded-lg font-medium ${tw.text.quaternary} hover:bg-gray-50 transition-colors`}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {importResults && importResults.error && (
                  <div className={`space-y-6`}>
                    <div className={`text-center`}>
                      <XCircle className={`w-16 h-16 text-red-500 mx-auto mb-4`} />
                      <h2 className={`text-2xl font-bold ${tw.text.primary} mb-2`}>Import Failed</h2>
                      <p className={`${tw.text.secondary}`}>{importResults.error}</p>
                    </div>

                    <button
                      onClick={resetImport}
                      className={`w-full ${tw.bg.secondary} ${tw.text.white} py-3 px-6 rounded-lg font-medium ${tw.button.secondary} transition-colors`}
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </>
            )}

            {/* EXPORT TAB */}
            {activeTab === 'export' && (
              <div className={`space-y-6`}>
                <div className={`text-center mb-8`}>
                  <FileDown className={`w-16 h-16 mx-auto ${tw.text.brandGreen} mb-4`} />
                  <h2 className={`text-2xl font-bold ${tw.text.primary} mb-2`}>Export Your Journal</h2>
                  <p className={`${tw.text.secondary}`}>Download all your entries for backup or transfer</p>
                </div>

                {/* Export Options */}
                <div className={`space-y-4`}>

                                      {/* JSON Export */}
                  <div className={`border-2 border-gray-200 rounded-lg p-6 hover:${tw.border.primary} hover:${tw.bg.main} transition-all`}>
                    <div className={`flex items-start gap-4`}>
                      <div className={`${tw.bg.main3} rounded-lg p-3`}>
                        <FileJson className={`w-8 h-8 ${tw.text.orange}`} />
                      </div>
                      <div className={`flex-1`}>
                        <h3 className={`font-semibold ${tw.text.primary} mb-1`}>Export as JSON</h3>
                        <p className={`text-sm ${tw.text.secondary} mb-4`}>
                          Complete data format with all fields. Best for backup and re-importing later.
                        </p>
                        <button
                          onClick={() => handleExport('json')}
                          disabled={exporting}
                          className={`${tw.button.primary} ${tw.text.white} py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {exporting ? 'Exporting...' : 'Download JSON'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                  {/* CSV Export */}
                  <div className={`border-2 border-gray-200 rounded-lg p-6 hover:${tw.border.primary} hover:${tw.bg.main} transition-all`}>
                    <div className={`flex items-start gap-4`}>
                      <div className={`${tw.bg.main2} rounded-lg p-3`}>
                        <FileText className={`w-8 h-8 ${tw.text.green}`} />
                      </div>
                      <div className={`flex-1`}>
                        <h3 className={`font-semibold ${tw.text.primary} mb-1`}>Export as CSV</h3>
                        <p className={`text-sm ${tw.text.secondary} mb-4`}>
                          Spreadsheet-compatible format. Great for analysis in Excel, Google Sheets, or other tools.
                        </p>
                        <button
                          onClick={() => handleExport('csv')}
                          disabled={exporting}
                          className={`${tw.button.secondaryDark} ${tw.text.white} py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {exporting ? 'Exporting...' : 'Download CSV'}
                        </button>
                      </div>
                    </div>
                  </div>

                {/* Export Info */}
                <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6`}>
                  <div className={`flex items-start gap-3`}>
                    <AlertCircle className={`w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0`} />
                    <div className={`text-sm text-amber-800`}>
                      <p className={`font-medium mb-1`}>Export Information:</p>
                      <ul className={`list-disc list-inside space-y-1 text-amber-700`}>
                        <li>All daily entry data (mood, energy level, word count, and daily tasks<sup>*</sup>) will be exported</li>
                        <li>Exported files can be re-imported later</li>
                        <li>Your data stays on your device, giving you total privacy and control</li>
                        <small><sup>*</sup>Daily Tasks only available in JSON format</small>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportPage;
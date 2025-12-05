import React, { useState } from 'react';
import { ModuleType, Language } from './types';
import ModuleSplitter from './components/ModuleSplitter';
import ModuleAssembler from './components/ModuleAssembler';
import { Layers, Scissors, Globe, ChefHat, Cookie, Mail } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.SPLITTER);
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen text-text font-sans pb-20 overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="fixed top-10 left-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="fixed top-10 right-10 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="fixed -bottom-8 left-20 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Top Navigation Bar */}
      <header className="sticky top-4 z-20 mx-4 sm:mx-auto max-w-5xl">
        <div className="bg-surface paper-card px-4 sm:px-6 h-20 flex items-center justify-between relative transform rotate-1 transition-transform hover:rotate-0">
           {/* Nail effect */}
          <div className="absolute -top-3 left-1/2 w-4 h-4 bg-gray-400 rounded-full shadow-inner border-2 border-gray-500 z-30 transform -translate-x-1/2"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center border-2 border-dashed border-white shadow-md transform -rotate-6">
              <ChefHat className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-display font-bold text-primary tracking-wide drop-shadow-sm">{t.appTitle}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex bg-orange-100 p-1.5 rounded-full border-2 border-orange-200 shadow-inner">
              <button
                onClick={() => setActiveModule(ModuleType.SPLITTER)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-lg font-bold transition-all ${
                  activeModule === ModuleType.SPLITTER
                    ? 'bg-white text-primary shadow-sm transform -rotate-1'
                    : 'text-orange-800/60 hover:text-orange-800 hover:bg-orange-50'
                }`}
              >
                <Scissors className="w-5 h-5" />
                {t.splitter.nav}
              </button>
              <button
                onClick={() => setActiveModule(ModuleType.ASSEMBLER)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-lg font-bold transition-all ${
                  activeModule === ModuleType.ASSEMBLER
                    ? 'bg-white text-primary shadow-sm transform rotate-1'
                    : 'text-orange-800/60 hover:text-orange-800 hover:bg-orange-50'
                }`}
              >
                <Layers className="w-5 h-5" />
                {t.assembler.nav}
              </button>
            </nav>

            <div className="relative group pb-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-outline rounded-2xl shadow-sketch hover:shadow-sketch-hover transition-all transform hover:-translate-y-0.5">
                <Globe className="w-5 h-5 text-accent" />
                <span className="uppercase font-bold text-text">{language}</span>
              </button>
              {/* Dropdown with pt-2 to bridge the hover gap */}
              <div className="absolute right-0 top-full pt-2 w-32 hidden group-hover:block z-50">
                <div className="bg-white rounded-2xl border-2 border-outline shadow-xl overflow-hidden">
                  {(['en', 'zh', 'ja'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`w-full text-left px-4 py-3 text-lg font-bold hover:bg-orange-50 transition-colors ${language === lang ? 'text-primary' : 'text-gray-600'}`}
                    >
                      {lang === 'en' ? 'English' : lang === 'zh' ? '中文' : '日本語'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Nav */}
        <div className="sm:hidden mt-4 flex justify-center">
           <nav className="flex space-x-2 bg-white/80 backdrop-blur p-2 rounded-3xl border border-outline shadow-sm w-full">
              <button
                onClick={() => setActiveModule(ModuleType.SPLITTER)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-base font-bold transition-all ${
                  activeModule === ModuleType.SPLITTER
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:bg-orange-50'
                }`}
              >
                <Scissors className="w-4 h-4" />
                {t.splitter.nav}
              </button>
              <button
                onClick={() => setActiveModule(ModuleType.ASSEMBLER)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-base font-bold transition-all ${
                  activeModule === ModuleType.ASSEMBLER
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:bg-orange-50'
                }`}
              >
                <Layers className="w-4 h-4" />
                {t.assembler.nav}
              </button>
            </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="transition-all duration-300 ease-in-out transform">
          {activeModule === ModuleType.SPLITTER ? (
            <ModuleSplitter />
          ) : (
            <ModuleAssembler />
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="text-center text-gray-500 py-8 font-hand relative z-10">
        <p className="flex items-center justify-center gap-2 text-lg mb-6">
          Made with <Cookie className="w-5 h-5 text-orange-400" /> in the {t.appTitle} Kitchen
        </p>
        
        <div className="inline-flex flex-col items-center justify-center gap-1.5 text-sm border-t-2 border-dashed border-orange-200/50 pt-6 px-12">
           <p className="font-display font-bold text-gray-600 text-base">济宁若森软件开发中心</p>
           <a href="mailto:business@itcox.cn" className="flex items-center gap-1.5 text-primary hover:text-primary-hover transition-colors">
             <Mail className="w-3 h-3" />
             business@itcox.cn
           </a>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
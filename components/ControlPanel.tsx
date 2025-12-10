
import React, { useState, useRef, useEffect } from 'react';
import { ToolMode, ItemType, QuoteItem, LineStyle } from '../types';
import { ITEM_CATALOG } from '../constants';
import { UploadIcon, PenToolIcon, EditIcon, RulerIcon, HomeIcon, ListIcon, CubeIcon, CameraIcon, DraftingIcon } from './Icons';

interface ControlPanelProps {
  toolMode: ToolMode;
  activeItemType: ItemType | null;
  onToolModeChange: (mode: ToolMode) => void;
  onSelectItemType: (type: ItemType | null) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDraftingToolSelect: (tool: ToolMode, style?: LineStyle) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  toolMode,
  activeItemType,
  onToolModeChange,
  onSelectItemType,
  onFileUpload,
  onDraftingToolSelect,
}) => {
  const [isDraftingMenuOpen, setIsDraftingMenuOpen] = useState(false);
  const draftingMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (draftingMenuRef.current && !draftingMenuRef.current.contains(event.target as Node)) {
        setIsDraftingMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDraftingSelect = (tool: ToolMode, style?: LineStyle) => {
      onDraftingToolSelect(tool, style);
      setIsDraftingMenuOpen(false);
  };
  
  const isDraftingActive = [ToolMode.DRAW_LINE, ToolMode.DRAW_RECT, ToolMode.DRAW_CIRCLE, ToolMode.DRAW_ARC, ToolMode.DRAW_DOUBLE_LINE].includes(toolMode);

  const handleItemClick = (type: ItemType) => {
    if (activeItemType === type) {
      onSelectItemType(null);
    } else {
      onSelectItemType(type);
    }
  };
  
  const renderDraftingButton = (isMobile: boolean) => (
    <div className="relative" ref={draftingMenuRef}>
        <button
            onClick={() => setIsDraftingMenuOpen(!isDraftingMenuOpen)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 rounded-md border transition-colors ${
            isDraftingActive
                ? 'bg-blue-500 text-white border-blue-500 shadow'
                : 'bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-400'
            }`}
        >
            <DraftingIcon className="w-5 h-5" />
            <span>作図ツール</span>
        </button>
        {isDraftingMenuOpen && (
            <div className={`absolute left-0 mb-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 text-sm ${isMobile ? 'bottom-full' : 'top-full'}`}>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50">直線</div>
                <button onClick={() => handleDraftingSelect(ToolMode.DRAW_LINE, 'solid')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">実線</button>
                <button onClick={() => handleDraftingSelect(ToolMode.DRAW_LINE, 'dashed')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">点線</button>
                <button onClick={() => handleDraftingSelect(ToolMode.DRAW_LINE, 'dashdot')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">一点鎖線</button>
                
                <div className="border-t my-1"></div>
                <button onClick={() => handleDraftingSelect(ToolMode.DRAW_RECT, 'solid')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">四角</button>
                
                <div className="border-t my-1"></div>
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50">円・円弧</div>
                <button onClick={() => handleDraftingSelect(ToolMode.DRAW_CIRCLE, 'solid')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">円</button>
                <button onClick={() => handleDraftingSelect(ToolMode.DRAW_ARC, 'solid')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">円弧 (3点)</button>
                
                <div className="border-t my-1"></div>
                <button onClick={() => handleDraftingSelect(ToolMode.DRAW_DOUBLE_LINE, 'solid')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">複線</button>
            </div>
        )}
    </div>
  );

  const renderTools = () => (
    <div className="space-y-4">
        <div>
            <h2 className="font-semibold text-gray-700 mb-2">ツール</h2>
            <div className="space-y-2">
                <button
                    onClick={() => onToolModeChange(toolMode === ToolMode.EDIT_SITE ? ToolMode.SELECT : ToolMode.EDIT_SITE)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                    toolMode === ToolMode.EDIT_SITE
                        ? 'bg-blue-500 text-white border-blue-500 shadow'
                        : 'bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-400'
                    }`}
                >
                    <EditIcon className="w-5 h-5" />
                    <span>敷地形状を編集</span>
                </button>
            </div>
        </div>

        <div className="pt-2 border-t">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">エクステリアを追加</h3>
            <div className="grid grid-cols-2 gap-2">
                {Object.entries(ITEM_CATALOG).map(([type, { name, icon: Icon }]) => (
                <button
                    key={type}
                    onClick={() => handleItemClick(type as ItemType)}
                    className={`p-2 border rounded-md flex flex-col items-center justify-center text-center transition-all ${
                    activeItemType === type
                        ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                        : 'bg-gray-100 hover:bg-blue-100 hover:border-blue-400'
                    }`}
                >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">{name}</span>
                </button>
                ))}
            </div>
        </div>

        <div className="pt-2 border-t">
            {renderDraftingButton(false)}
        </div>
    </div>
  );

  return (
    <>
        {/* DESKTOP LAYOUT */}
        <aside className="hidden md:flex w-80 bg-white h-full shadow-lg flex-col p-4 overflow-y-auto z-10">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">外構見積り</h1>
            <div className="flex-grow">
                {renderTools()}
            </div>
        </aside>

        {/* MOBILE LAYOUT */}
        <div className="md:hidden">
            <div className="fixed bottom-0 left-0 w-full z-30 bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-2xl pointer-events-auto p-2 pb-safe">
                <div className="grid grid-cols-4 gap-1">
                    {Object.entries(ITEM_CATALOG).map(([type, { name, icon: Icon }]) => (
                        <button
                            key={type}
                            onClick={() => handleItemClick(type as ItemType)}
                            className={`p-1 border rounded-md flex flex-col items-center justify-center text-center transition-all aspect-square ${
                                activeItemType === type
                                ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                                : 'bg-gray-50 hover:bg-blue-50 hover:border-blue-400'
                            }`}
                        >
                            <Icon className="w-7 h-7" />
                            <span className="text-[10px] font-medium leading-tight mt-1">{name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    </>
  );
};
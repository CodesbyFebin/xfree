import React from "react";
import { DropboxIcon } from "lucide-react";

interface DropboxConnectionProps {
  onConnect: (connected: boolean) => void;
}

export const DropboxConnection: React.FC<DropboxConnectionProps> = ({ onConnect }) => {
  const [connected, setConnected] = React.useState(false);

  const handleConnect = () => {
    setConnected(!connected);
    onConnect(connected);
  };

  return (
    <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-500/40 rounded-xl p-5 border border-cyan-500/30">
      <div className="flex items-center gap-2 mb-3">
        <DropboxIcon className="h-5 w-5" />
        <span className="text-cyan-300">Dropbox</span>
      </div>
      <p className="text-sm text-cyan-200">Connect your Dropbox account to sync project files and collaborate seamlessly.</p>
      <button
        onClick={handleConnect}
        className={`w-full py-2.5 rounded-xl font-bold text-white transition-colors focus-ring focus-ring-cyan-500`}
        disabled={connected}
      >
        {connected ? "✅ Connected" : "🔌 Connect Dropbox"}
      </button>
    </div>
  );
};

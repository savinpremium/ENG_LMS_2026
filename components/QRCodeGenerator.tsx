
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  value: string;
  size?: number;
}

const QRCodeGenerator: React.FC<Props> = ({ value, size = 128 }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center">
      <QRCodeSVG value={value} size={size} />
    </div>
  );
};

export default QRCodeGenerator;

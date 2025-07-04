import React, { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './App.css';

/**
 * Componente React para convertir un archivo .txt delimitado por llaves ({)
 * en un archivo .xlsx con columnas ajustadas según el tamaño de los datos
 * y respetando el nombre original del archivo.
 */
export default function TxtToXlsxConverter() {
  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (!lines.length) return;

      // Encabezados y datos
      const headers = lines[0].split('{').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split('{').map(v => v.trim());
        return headers.reduce((obj, header, idx) => {
          obj[header] = values[idx] ?? '';
          return obj;
        }, {});
      });

      // Crear worksheet y workbook
      const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      // Calcular anchos de columna basados en la primera fila de datos y encabezados
      const firstRow = data[0] || {};
      worksheet['!cols'] = headers.map(header => {
        const headerWidth = header.length;
        const cellWidth = String(firstRow[header] || '').length;
        return { wch: Math.max(headerWidth, cellWidth) + 2 };
      });

      // Generar y descargar el archivo
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      saveAs(blob, `${baseName}.xlsx`);
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) handleFile(e.dataTransfer.files[0]);
  }, []);
  const onDragOver = useCallback((e) => e.preventDefault(), []);
  const onFileChange = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  return (
    <div className="container">
      <h2 className="heading">Convertir TXT a XLSX</h2>
      <div
        className="dropzone"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <input
          id="fileInput"
          type="file"
          accept=".txt"
          className="hidden-input"
          onChange={onFileChange}
        />
        <p className="drop-text">Arrastra aquí tu archivo <code>.txt</code> o haz clic para seleccionarlo</p>
        <p className="info-text">(Solo sirve con <code>llaves</code>)</p>
      </div>
    </div>
  );
}

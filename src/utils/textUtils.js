// src/utils/textUtils.js

import React from 'react';

/**
 * Mengubah karakter baris baru (\n) menjadi elemen HTML <br />.
 * Digunakan untuk menampilkan teks dari textarea dengan format paragraf yang benar.
 * @param {string} text Teks yang akan diformat.
 * @returns {React.Fragment} Elemen React yang sudah diformat.
 */
export const renderTextWithBreaks = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < text.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));
};
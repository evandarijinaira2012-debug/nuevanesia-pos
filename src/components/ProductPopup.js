import React from 'react';
import styles from '../styles/ProductPopup.module.css';
import Image from 'next/image';
import { renderTextWithBreaks } from '../utils/textUtils';

const ProductPopup = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div className={styles['popup-overlay']} onClick={onClose}>
      <div className={styles['popup-container']} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles['close-button']}>X</button>
        
        <div className={styles['popup-content-grid']}>
          {/* Kolom 1: Gambar */}
          <div className={styles['popup-image-container']}>
            <img src={product.url_gambar || '/images/placeholder.png'} alt={product.nama} className={styles['popup-image']} />
          </div>

          {/* Kolom 2: Konten Deskripsi */}
          <div className={styles['popup-details-container']}>
            <h2>{product.nama}</h2>
            
            {/* Div yang bisa di-scroll */}
            <div className={styles['scrollable-content']}>
              <p>
                <strong className={styles['details-label']}>Deskripsi: </strong>
                {/* PENGGUNAAN FUNGSI BARU DI SINI */}
                <span>{renderTextWithBreaks(product.description)}</span>
              </p>
              <p>
                <strong className={styles['details-label']}>Stok Tersedia: </strong>
                <span>{product.stok}</span>
              </p>
              <p>
                <strong className={styles['details-label']}>Catatan Penanganan: </strong>
                {/* PENGGUNAAN FUNGSI BARU DI SINI */}
                <span className={styles['handling-notes-content']}>{renderTextWithBreaks(product.handling_notes)}</span>
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProductPopup;
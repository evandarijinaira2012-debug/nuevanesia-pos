import React from 'react';
import styles from '../styles/ProductPopup.module.css';
import { renderTextWithBreaks } from '../utils/textUtils';


// Kita menambahkan props onAddToCart dan jenisLayananTerpilih
const ProductPopup = ({ product, onClose, onAddToCart, jenisLayananTerpilih }) => {
  if (!product) return null;

  const isLaundry = jenisLayananTerpilih === 'Laundry';

  return (
    <div className={styles['popup-overlay']} onClick={onClose}>
      <div className={styles['popup-container']} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles['close-button']}>X</button>
        
        <div className={styles['popup-content-grid']}>
          {/* Kolom 1: Gambar */}
          <div className={styles['popup-image-container']}>
            <img src={product.url_gambar || '/images/placeholder.png'} alt={product.nama} className={styles['popup-image']} />
          </div>

          {/* Kolom 2: Konten Deskripsi & Variasi */}
          <div className={styles['popup-details-container']}>
            <h2>{product.nama}</h2>
            
            {/* Div yang bisa di-scroll */}
            <div className={styles['scrollable-content']}>
              <p>
                <strong className={styles['details-label']}>Deskripsi: </strong>
                <span>{renderTextWithBreaks(product.description)}</span>
              </p>
              
              {/* --- AREA VARIASI PRODUK BARU --- */}
              <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                <strong className={styles['details-label']}>Pilih Variasi:</strong>
                
                {product.produk_variasi && product.produk_variasi.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                    {product.produk_variasi.map((variasi) => {
                      // Jika bukan laundry dan stoknya 0 atau kurang, maka statusnya habis
                      const isOutOfStock = !isLaundry && variasi.stok <= 0;
                      
                      return (
                        <div 
                          key={variasi.id} 
                          style={{ 
                            border: '1px solid #374151', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            backgroundColor: '#1F2937'
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, fontWeight: 'bold', color: '#F3F4F6' }}>{variasi.nama_variasi}</p>
                            <p style={{ margin: 0, color: '#2DD4BF', fontSize: '0.9rem', fontWeight: '600' }}>
                              Rp{variasi.harga.toLocaleString('id-ID')}
                            </p>
                            
                            {/* Hanya tampilkan stok jika bukan layanan Laundry */}
                            {!isLaundry && (
                              <p style={{ margin: 0, fontSize: '0.8rem', marginTop: '4px', color: isOutOfStock ? '#EF4444' : '#9CA3AF' }}>
                                {isOutOfStock ? 'Stok Habis' : `Stok: ${variasi.stok}`}
                              </p>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => onAddToCart(product, variasi)}
                            disabled={isOutOfStock}
                            style={{ 
                              backgroundColor: isOutOfStock ? '#374151' : '#0D9488', 
                              color: isOutOfStock ? '#9CA3AF' : 'white',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            + Tambah
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#9CA3AF', fontStyle: 'italic', marginTop: '8px', fontSize: '0.9rem' }}>
                    Data variasi belum tersedia untuk produk ini.
                  </p>
                )}
              </div>
              {/* --- AKHIR AREA VARIASI --- */}

              <p>
                <strong className={styles['details-label']}>Catatan Penanganan: </strong>
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
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
            {/* Judul Produk */}
            <h2 style={{ marginBottom: '16px' }}>{product.nama}</h2>
            
            {/* Div yang bisa di-scroll */}
            <div className={styles['scrollable-content']}>
              
              {/* 1. AREA VARIASI PRODUK (Pindah ke paling atas) */}
              <div style={{ marginBottom: '20px' }}>
                <strong className={styles['details-label']}>Pilih Variasi:</strong>
                
                {product.produk_variasi && product.produk_variasi.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    {product.produk_variasi.map((variasi) => {
                      const isOutOfStock = !isLaundry && variasi.stok <= 0;
                      
                      return (
                        <div 
                          key={variasi.id} 
                          style={{ 
                            border: '1px solid #374151', 
                            padding: '16px', // Padding sedikit dilebarkan agar lebih lega 
                            borderRadius: '8px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            backgroundColor: '#1F2937',
                            transition: 'border-color 0.2s', // Efek transisi halus
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, fontWeight: '600', color: '#F3F4F6', fontSize: '1.05rem', letterSpacing: '0.01em' }}>
                              {variasi.nama_variasi}
                            </p>
                            <p style={{ margin: '4px 0 0 0', color: '#2DD4BF', fontSize: '0.95rem', fontWeight: '700' }}>
                              Rp{variasi.harga.toLocaleString('id-ID')}
                            </p>
                            
                            {!isLaundry && (
                              <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: isOutOfStock ? '#EF4444' : '#9CA3AF', fontWeight: '500' }}>
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
                              padding: '10px 20px', // Tombol sedikit diperbesar
                              borderRadius: '6px',
                              border: 'none',
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              fontSize: '0.9rem',
                              letterSpacing: '0.02em',
                              transition: 'all 0.2s ease-in-out'
                            }}
                            onMouseOver={(e) => { if(!isOutOfStock) e.target.style.backgroundColor = '#0F766E' }}
                            onMouseOut={(e) => { if(!isOutOfStock) e.target.style.backgroundColor = '#0D9488' }}
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
              
              {/* 2. CATATAN PENANGANAN (Berada tepat setelah Variasi) */}
              <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #374151' }}>
                <strong className={styles['details-label']}>Catatan Penanganan: </strong>
                <div style={{ marginTop: '8px' }} className={styles['handling-notes-content']}>
                  {renderTextWithBreaks(product.handling_notes)}
                </div>
              </div>

              {/* 3. DESKRIPSI (Pindah ke paling bawah) */}
              <div>
                <strong className={styles['details-label']}>Deskripsi: </strong>
                <div style={{ marginTop: '8px', color: '#D1D5DB', lineHeight: '1.6' }}>
                  {renderTextWithBreaks(product.description)}
                </div>
              </div>

            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProductPopup;
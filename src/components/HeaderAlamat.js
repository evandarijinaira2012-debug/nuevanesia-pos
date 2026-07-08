export default function HeaderAlamat() {
  return (
    <div className="header-container">
      <img src="/nuevanesialogo.png" alt="Logo Nuevanesia" className="logo" />
      <div className="alamat">
        <p>Jl Sarirasa V Blok 4 No 114 Bandung</p>
        <p>Tlp. 08180.208.9909</p>
      </div>

      <style jsx>{`
        .header-container {
          text-align: center;
          margin-bottom: 12px;
        }
        .logo {
          max-width: 38mm;
          height: auto;
          margin-bottom: 5px;
        }
        .alamat p {
          margin: 0;
          font-size: 11px;
          line-height: 1.3;
        }
      `}</style>
    </div>
  );
}
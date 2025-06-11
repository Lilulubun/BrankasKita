// src/app/components/Footer/Footer.tsx
import Link from 'next/link';
import styles from './Footer.module.css';
// Import icons
import { FaClock, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { FaInstagram, FaTiktok, FaTwitter, FaYoutube, FaFacebook, FaTelegram } from 'react-icons/fa';

export default function Footer(): React.ReactElement {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        {/* Contact Us Section */}
        <div className={styles.footerSection}>
          <h2 className={styles.sectionTitle}>Contact us</h2>
          <ul className={styles.contactList}>
            <li className={styles.contactItem}>
              <FaClock className={styles.icon} />
              <span>Monday - Friday, 09.00 - 17.00</span>
            </li>
            <li className={styles.contactItem}>
              <FaEnvelope className={styles.icon} />
              <span>brankaskita@gmail.com</span>
            </li>
            <li className={styles.contactItem}>
              <FaPhone className={styles.icon} />
              <span>08123456789</span>
            </li>
            <li className={styles.contactItem}>
              <FaMapMarkerAlt className={styles.icon} />
              <span>Universitas Islam Indonesia, Gedung K.H. Mas Mansyur, Daerah Istimewa Yogyakarta 55584</span>
            </li>
          </ul>
        </div>

        {/* Feature Section */}
        <div className={styles.footerSection}>
          <h2 className={styles.sectionTitle}>Feature</h2>
          <ul className={styles.featureList}>
            <li><Link href="/" className={styles.footerLink}>Home</Link></li>
            <li><Link href="/booking" className={styles.footerLink}>Booking</Link></li>
            <li><Link href="/my-orders" className={styles.footerLink}>My Orders</Link></li>
            <li><Link href="/notifications" className={styles.footerLink}>Notifications</Link></li>
          </ul>
        </div>

        {/* Social Media Section */}
        <div className={styles.footerSection}>
          <h2 className={styles.sectionTitle}>Follow us on</h2>
          <div className={styles.socialGrid}>
            <div className={styles.socialItem}>
              <FaInstagram className={styles.socialIcon} />
              <Link href="https://instagram.com" className={styles.footerLink}>Instagram</Link>
            </div>
            <div className={styles.socialItem}>
              <FaTiktok className={styles.socialIcon} />
              <Link href="https://tiktok.com" className={styles.footerLink}>TikTok</Link>
            </div>
            <div className={styles.socialItem}>
              <FaTwitter className={styles.socialIcon} />
              <Link href="https://twitter.com" className={styles.footerLink}>Twitter</Link>
            </div>
            <div className={styles.socialItem}>
              <FaYoutube className={styles.socialIcon} />
              <Link href="https://youtube.com" className={styles.footerLink}>Youtube</Link>
            </div>
            <div className={styles.socialItem}>
              <FaFacebook className={styles.socialIcon} />
              <Link href="https://facebook.com" className={styles.footerLink}>Facebook</Link>
            </div>
            <div className={styles.socialItem}>
              <FaTelegram className={styles.socialIcon} />
              <Link href="https://t.me" className={styles.footerLink}>Telegram</Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className={styles.copyright}>
        Copyright © 2025 BrankasKita. All rights reserved
      </div>
    </footer>
  );
}
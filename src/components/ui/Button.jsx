import styles from './Button.module.css'

export default function Button({ children, variant = 'primary', size = 'md', disabled, loading, onClick, type = 'button', fullWidth, ...props }) {
  return (
    <button
      type={type}
      className={[styles.btn, styles[variant], styles[size], fullWidth ? styles.full : '', disabled || loading ? styles.disabled : ''].join(' ')}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  )
}

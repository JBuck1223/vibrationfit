module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Allow unescaped entities in JSX (quotes, apostrophes)
    'react/no-unescaped-entities': 'off',
    
    // Allow img tags (we'll optimize these later)
    '@next/next/no-img-element': 'warn',
    
    // Allow unused variables in some cases
    '@typescript-eslint/no-unused-vars': 'warn',
    
    // Allow any types in some cases
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Allow missing dependencies in useEffect
    'react-hooks/exhaustive-deps': 'warn',
    
    // Allow anonymous default exports
    'import/no-anonymous-default-export': 'warn'
  }
}

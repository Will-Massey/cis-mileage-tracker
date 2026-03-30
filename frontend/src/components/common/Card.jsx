import React from 'react';

/**
 * Card Component
 * Reusable card container with optional header, footer, and actions
 * 
 * @param {ReactNode} children - Card content
 * @param {string} title - Card title
 * @param {ReactNode} header - Custom header content
 * @param {ReactNode} footer - Footer content
 * @param {ReactNode} actions - Action buttons
 * @param {boolean} hoverable - Add hover effect
 * @param {boolean} clickable - Add pointer cursor
 * @param {function} onClick - Click handler
 * @param {string} className - Additional classes
 */
const Card = ({
  children,
  title,
  header,
  footer,
  actions,
  hoverable = false,
  clickable = false,
  onClick,
  className = ''
}) => {
  const baseClasses = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden';
  const hoverClasses = hoverable ? 'hover:shadow-md transition-shadow duration-200' : '';
  const clickableClasses = clickable ? 'cursor-pointer' : '';
  
  const classes = `
    ${baseClasses}
    ${hoverClasses}
    ${clickableClasses}
    ${className}
  `.trim();
  
  return (
    <div 
      className={classes}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {/* Header */}
      {(title || header || actions) && (
        <div className="px-4 py-4 sm:px-6 border-b border-gray-100">
          {header ? (
            header
          ) : (
            <div className="flex items-center justify-between">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {actions && (
                <div className="flex items-center space-x-2">
                  {actions}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="px-4 py-4 sm:px-6">
        {children}
      </div>
      
      {/* Footer */}
      {footer && (
        <div className="px-4 py-3 sm:px-6 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
};

/**
 * Card.Section - Card subsection
 */
Card.Section = ({ children, className = '' }) => (
  <div className={`py-3 ${className}`}>
    {children}
  </div>
);

/**
 * Card.Divider - Visual divider within card
 */
Card.Divider = () => (
  <div className="my-4 border-t border-gray-100" />
);

/**
 * Card.Row - Horizontal row with label and value
 */
Card.Row = ({ label, value, className = '' }) => (
  <div className={`flex justify-between items-center py-2 ${className}`}>
    <span className="text-gray-600">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

export default Card;

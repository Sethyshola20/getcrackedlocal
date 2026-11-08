export function StackIllustration() {
  return (
    <div className="stack-art" aria-hidden="true">
      <div className="art-grid" />
      <span className="art-tag top">ABSTRACTIONS ↑</span>
      <svg viewBox="0 0 380 320" className="stack-svg">
        <defs>
          <linearGradient id="stackTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#323232" />
            <stop offset="1" stopColor="#202020" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(0,${i * 51})`}>
            <path
              d="M84 107 L194 47 L307 107 L194 170 Z"
              fill={i === 0 ? "url(#stackTop)" : "#1e1e1e"}
              stroke={i === 1 ? "#c0c0c0" : "#676767"}
              strokeWidth="1.1"
            />
            <path
              d="M84 107 V121 L194 183 L307 121 V107 L194 170Z"
              fill="#181818"
              stroke="#4f4f4f"
              strokeWidth="1"
            />
            <path d="M194 170V183" stroke="#595959" />
            {i === 0 && (
              <>
                <path
                  d="M156 109l38-21 39 21-39 22z"
                  fill="#bdbdbd"
                  fillOpacity=".1"
                  stroke="#d3d3d3"
                />
                <path
                  d="M169 109l25-14 26 14-26 14z"
                  fill="#d2d2d2"
                  fillOpacity=".3"
                />
                {[0, 1, 2, 3].map((k) => (
                  <g key={k}>
                    <path
                      d={`M${149 - k * 9} ${104 - k * 5}l-13 -7M${201 + k * 9} ${84 + k * 5}l13 -7M${237 + k * 9} ${115 + k * 5}l13 7M${188 - k * 9} ${135 - k * 5}l-13 7`}
                      stroke="#bdbdbd"
                      strokeOpacity=".5"
                    />
                  </g>
                ))}
              </>
            )}
          </g>
        ))}
        <path
          d="M42 202h26l19 11M308 159l22-13h31M194 285v20"
          fill="none"
          stroke="#878787"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <circle cx="42" cy="202" r="3" fill="#d1d1d1" />
        <circle cx="361" cy="146" r="3" fill="#d1d1d1" />
        <path
          d="M86 107l108-60 113 60"
          fill="none"
          stroke="#dfdfdf"
          strokeOpacity=".6"
        />
        <circle cx="194" cy="109" r="3" fill="#e3e3e3" />
      </svg>
      <span className="art-label one">
        <i />
        YOUR CODE
      </span>
      <span className="art-label two">
        <i />
        THE RUNTIME
      </span>
      <span className="art-label three">
        <i />
        THE HARDWARE
      </span>
      <span className="art-tag bottom">↓ UNDERSTANDING</span>
      <span className="art-cross a">+</span>
      <span className="art-cross b">+</span>
    </div>
  );
}

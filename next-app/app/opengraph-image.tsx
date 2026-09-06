import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'XFree - Free Developer & SEO Tools';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0f',
          padding: '60px',
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 255, 65, 0.1)',
              border: '1px solid rgba(0, 255, 65, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              fontWeight: 900,
              color: '#00ff41',
            }}
          >
            X
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: '56px',
                fontWeight: 900,
                color: '#ffffff',
              }}
            >
              XFree
            </span>
            <span
              style={{
                fontSize: '28px',
                color: '#00ff41',
              }}
            >
              Free Developer & SEO Tools
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '40px',
          }}
        >
          <FeatureItem text="100% Client-Side Processing" />
          <FeatureItem text="No Signup Required" />
          <FeatureItem text="Privacy-First Design" />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '60px',
            right: '60px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              color: '#666666',
            }}
          >
            xfree.in
          </span>
          <span
            style={{
              fontSize: '20px',
              color: '#00ff41',
            }}
          >
            Get X Done for Free
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#00ff41',
        }}
      />
      <span
        style={{
          fontSize: '22px',
          color: '#888888',
        }}
      >
        {text}
      </span>
    </div>
  );
}

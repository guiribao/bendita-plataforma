import { useMemo, useState } from 'react';
import { Button, ButtonGroup, Form, Modal } from 'react-bootstrap';

type DocumentViewerModalProps = {
  show: boolean;
  onHide: () => void;
  fileUrl: string | null;
  fileName?: string;
};

function getFileExtension(fileName: string): string {
  const cleanName = fileName.split('?')[0];
  const ext = cleanName.split('.').pop();
  return ext ? ext.toLowerCase() : '';
}

function withDownloadQuery(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}download=1`;
}

export default function DocumentViewerModal({
  show,
  onHide,
  fileUrl,
  fileName = 'documento',
}: DocumentViewerModalProps) {
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [imageZoom, setImageZoom] = useState(1);

  const extension = useMemo(() => getFileExtension(fileName), [fileName]);
  const isPdf = extension === 'pdf';
  const isImage = extension === 'jpg' || extension === 'jpeg' || extension === 'png';

  const iframeUrl = useMemo(() => {
    if (!fileUrl || !isPdf) return null;
    return `${fileUrl}#page=${pdfPage}&zoom=${pdfZoom}`;
  }, [fileUrl, isPdf, pdfPage, pdfZoom]);

  const downloadUrl = fileUrl ? withDownloadQuery(fileUrl) : null;

  const resetControls = () => {
    setPdfPage(1);
    setPdfZoom(100);
    setImageZoom(1);
  };

  return (
    <Modal
      show={show}
      onHide={() => {
        resetControls();
        onHide();
      }}
      size='xl'
      centered
      dialogClassName='document-viewer-modal'
    >
      <Modal.Header closeButton>
        <Modal.Title className='d-flex align-items-center gap-2'>
          <i className='las la-file-alt text-primary' />
          <span>{fileName}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {!fileUrl ? (
          <div className='text-center text-muted py-5'>
            <i className='las la-exclamation-circle fs-1 d-block mb-2' />
            URL do documento indisponível.
          </div>
        ) : (
          <>
            <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3'>
              <div className='d-flex flex-wrap align-items-center gap-2'>
                {isPdf && (
                  <>
                    <ButtonGroup aria-label='Navegacao PDF'>
                      <Button
                        variant='outline-secondary'
                        onClick={() => setPdfPage((current) => Math.max(1, current - 1))}
                        disabled={pdfPage <= 1}
                      >
                        <i className='las la-angle-left' />
                      </Button>
                      <Button variant='outline-secondary' disabled>
                        Pagina {pdfPage}
                      </Button>
                      <Button variant='outline-secondary' onClick={() => setPdfPage((current) => current + 1)}>
                        <i className='las la-angle-right' />
                      </Button>
                    </ButtonGroup>

                    <ButtonGroup aria-label='Zoom PDF'>
                      <Button variant='outline-secondary' onClick={() => setPdfZoom((current) => Math.max(50, current - 10))}>
                        <i className='las la-search-minus' />
                      </Button>
                      <Button variant='outline-secondary' disabled>
                        {pdfZoom}%
                      </Button>
                      <Button variant='outline-secondary' onClick={() => setPdfZoom((current) => Math.min(250, current + 10))}>
                        <i className='las la-search-plus' />
                      </Button>
                    </ButtonGroup>
                  </>
                )}

                {isImage && (
                  <ButtonGroup aria-label='Zoom imagem'>
                    <Button variant='outline-secondary' onClick={() => setImageZoom((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))))}>
                      <i className='las la-search-minus' />
                    </Button>
                    <Button variant='outline-secondary' disabled>
                      {Math.round(imageZoom * 100)}%
                    </Button>
                    <Button variant='outline-secondary' onClick={() => setImageZoom((current) => Math.min(4, Number((current + 0.1).toFixed(2))))}>
                      <i className='las la-search-plus' />
                    </Button>
                  </ButtonGroup>
                )}
              </div>

              <div className='d-flex align-items-center gap-2'>
                <Form.Text className='text-muted'>
                  {isPdf ? 'Use os controles para navegar e dar zoom no PDF.' : 'Use os controles para dar zoom na imagem.'}
                </Form.Text>
                {downloadUrl && (
                  <Button as='a' href={downloadUrl} variant='primary' target='_blank' rel='noreferrer'>
                    <i className='las la-download me-1' />
                    Download
                  </Button>
                )}
              </div>
            </div>

            <div
              className='border rounded bg-light-subtle d-flex align-items-center justify-content-center'
              style={{ minHeight: '65vh', overflow: 'auto' }}
            >
              {isPdf && iframeUrl && (
                <iframe
                  title={`Visualizacao de ${fileName}`}
                  src={iframeUrl}
                  style={{ width: '100%', height: '65vh', border: 'none', background: '#fff' }}
                />
              )}

              {isImage && (
                <img
                  src={fileUrl}
                  alt={fileName}
                  style={{
                    transform: `scale(${imageZoom})`,
                    transformOrigin: 'center center',
                    maxWidth: '100%',
                    maxHeight: '65vh',
                    transition: 'transform 0.15s ease',
                  }}
                />
              )}

              {!isPdf && !isImage && (
                <div className='text-center text-muted py-5'>
                  <i className='las la-file fs-1 d-block mb-2' />
                  Formato nao suportado para preview.
                </div>
              )}
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}

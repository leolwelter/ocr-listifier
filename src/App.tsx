import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import {createWorker} from 'tesseract.js';
import {Card, Icon, Tooltip} from "@material-ui/core";

function AppComponent() {
    // state variables
    let [ocrText, setOcrText] = useState<string>();
    let [ocrImg, setOcrImg] = useState<string>(); // data url for img src
    let videoInput = useRef<HTMLVideoElement>(null);
    let [fileInput] = useState(React.createRef<HTMLInputElement>());
    let [loadingProgress, setLoadingProgress] = useState<string>();

    // one-time component mount logic
    const worker = createWorker({
        logger: m => {
            console.log(m);
            if (m.status === 'recognizing text') setLoadingProgress(`${m.progress * 100}%`);
        },
    });

    useEffect(() => {
        console.log('Getting user media devices');
        if (!navigator.mediaDevices) {
            console.warn('no media devices found');
            return;
        }
        navigator.mediaDevices.getUserMedia({video: true, audio: false})
            .then(function (stream) {
                if (videoInput.current) {
                    videoInput.current.srcObject = stream;
                    videoInput.current.play();
                }
            })
            .catch(function (err) {
                console.log("An error occurred: " + err);
            });
    }, [videoInput]);


    async function doOcr(imgUrl: string) {
        setOcrText(undefined);
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const {data: {text}} = await worker.recognize(imgUrl);
        setOcrText(text);
        setLoadingProgress(undefined);
    }

    function handleFileSubmit(event: any) {
        if (fileInput.current && fileInput.current.files) {
            const imgUrl = URL.createObjectURL(fileInput.current.files[0]);
            setOcrImg(imgUrl);
            doOcr(imgUrl);
        } else {
            console.log('wrong move, dummy');
        }
    }

    function clearFile() {
        if (fileInput.current) {
            console.log('Clearing files');
            setOcrImg(undefined);
            setOcrText(undefined);
            fileInput.current.files = null;
        }
    }

    async function handlePaste() {
        // @ts-ignore TODO get typings for navigator.clipboard
        navigator.clipboard.read().then(
            async (items: any) => {
                const item = items[0];
                const type = item.types[0];
                const blob = await item.getType(type);
                const imgURL = URL.createObjectURL(blob);
                setOcrImg(imgURL);
                doOcr(imgURL);
                return;
            },
            (err: any) => console.error(err)
        );
    }

    return <div className='row'>
        <div className='col-12 col-sm-3 col-md-2'>
            <Card>
                <h5>Take a Picture</h5>
                <div className='embed-responsive embed-responsive-4by3'>
                    <video className='embed-responsive-item' ref={videoInput} id="video">Video stream not available.
                    </video>
                </div>
            </Card>

            <Card>
                <div onPaste={handlePaste} className='form-group'>
                    <h5>Upload file <Tooltip title='Copy-paste files here too!'><Icon>help</Icon></Tooltip></h5>
                    <input className='form-control-file' ref={fileInput} multiple={false} type="file"/>
                </div>
                <div className='btn-group'>
                    <button className='btn btn-primary' onClick={handleFileSubmit}>Submit</button>
                    <button className='btn btn-secondary' onClick={clearFile}>Clear</button>
                </div>
            </Card>
        </div>
        <div className='col-12 col-sm-4 col-md-3' hidden={!ocrImg}>
            <h5>Image:</h5>
            <img hidden={!ocrImg} src={ocrImg} className='img-fluid' alt='whoops'/>
        </div>
        <div className='col-12 col-sm-5 col-md-7'>
            <div hidden={!ocrText}>
                <h5>Result:</h5>
                <pre>{ocrText}</pre>
            </div>
            <div hidden={!loadingProgress || !(!ocrText)}>
                <div className="progress">
                    <div className="progress-bar progress-bar-striped progress-bar-animated"
                         role="progressbar"
                         style={{width: loadingProgress}}
                         aria-valuetext={loadingProgress} aria-valuemin={0} aria-valuemax={100}/>
                </div>
            </div>
        </div>
    </div>;
}

export default AppComponent;

import React, { useState, useEffect, useRef } from "react";
import { Accordion } from 'react-bootstrap';
import { 
  FaUser, FaCar, FaWrench, FaCamera, FaVideo, FaTimes,
  FaDownload, FaRecordVinyl, FaStop, FaPowerOff, FaPause, 
  FaPlay, FaSearchPlus, FaSearchMinus, FaExpand,
} from 'react-icons/fa';
import { BsImageFill, BsPlayBtnFill, BsXLg } from 'react-icons/bs';

import { BsCircle, BsSquare } from 'react-icons/bs'; // Bootstrap icons
import { HiOutlineArrowRight } from 'react-icons/hi'; // Heroicons
import { RxDash } from 'react-icons/rx'; // Radix Icons (for line)

// import Header from "../header/Header";
import 'react-toastify/dist/ReactToastify.css';
// import BottomNav from '../BottomNav';
// import postApiCall from "../../Services/postApiCall";
// import getApiCall from "../../Services/getApiCall";
import { toast } from "react-toastify";
import "./home.css"

const iconStyle = {
  fontSize: '18px',
};


const Home = () => {
  // State for holding customer form data
  const [customer, setCustomer] = useState({
    fullName: '',
    email: '',
    dob: '',
    mobile: '',
    address: '',
    province: '',
    city: '',
    zipcode: '',
  });

  // State for holding vehicle form data
  const [vehicle, setVehicle] = useState({
    plateNo: '',
    series: '',
    model: '',
    year: '',
    warranty: '',
  });
  
  const [service, setService] = useState({
	  serviceType: '',
	  jobCategory: '',
	  job: '',
	});
	
	useEffect(() => {
  const dropdowns = document.querySelectorAll('.dropdown-toggle');
  dropdowns.forEach(dropdown => {
    new window.bootstrap.Dropdown(dropdown);
  });
}, []);

  // Function to handle customer form changes
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
	
	if(name==='mobile')
	{
		checkMobile(value);
	}
  };

  // Function to handle vehicle form changes
  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setVehicle({ ...vehicle, [name]: value });
  };

	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const mediaRecorderRef = useRef(null);
	const recordedChunksRef = useRef([]);
	const [recording, setRecording] = useState(false);
	const [videoURL, setVideoURL] = useState(null);
	const [stream, setStream] = useState(null);
	const [isPaused, setIsPaused] = useState(false);
	const [images, setImages] = useState([]);
	const [zoom, setZoom] = useState(1);
	const animationRef = useRef(null);
	
	const [modalOpen, setModalOpen] = useState(false);
	const [modalContent, setModalContent] = useState(null);
	
	const [modalVideoOpen, setModalVideoOpen] = useState(false);
	
	const openModal = (type, url) => {
	  setModalContent({ type, url });
	  setModalOpen(true);
	};

	const closeModal = () => {
	  setModalOpen(false);
	  setModalContent(null);
	};
	
	const openVideoModal = () => {
	  setModalVideoOpen(true);
	};

	const closeVideoModal = () => {
	  setModalVideoOpen(false);
	};

	//Start camera stream
	const startCamera = async () => {
  try {
    openVideoModal();

    const constraintsEnv = {
      video: {
        facingMode: { ideal: "environment" } // Use "ideal" instead of "exact" for better fallback
      },
      audio: true
    };

    const constraintsUser = {
      video: {
        facingMode: { ideal: "user" }
      },
      audio: true
    };

    let newStream;

    try {
      // Try environment camera (back camera on mobile)
      newStream = await navigator.mediaDevices.getUserMedia(constraintsEnv);
    } catch (errEnv) {
      console.warn("Environment camera not available, falling back to user camera.", errEnv);
      // Fallback to user-facing camera
      newStream = await navigator.mediaDevices.getUserMedia(constraintsUser);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = newStream;

      // Ensure video starts playing on iOS
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.setAttribute("autoplay", "true");
      videoRef.current.setAttribute("muted", "true"); // Required for autoplay on some mobile browsers
      await videoRef.current.play();
    }

    setStream(newStream);
    cameraDate();
  } catch (err) {
    alert('Could not access camera: ' + err.message);
    console.error(err);
  }
};

  
	const cameraDate = () => {
	  const canvas = canvasRef.current;
	  const ctx = canvas?.getContext('2d');
	  const video = videoRef.current;

	  function draw() {
		if (!video || !canvas || !ctx) return;

		if (video.readyState === video.HAVE_ENOUGH_DATA) {
		  
			const screenWidth = window.innerWidth;
			const screenHeight = window.innerHeight;
			
			canvas.width = video.videoWidth;
		  canvas.height = video.videoHeight;
		
		  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		  const timestamp = new Date().toLocaleString();

		  const fontSize = Math.max(canvas.width * 0.02, 12);
		  ctx.font = `${fontSize}px Arial`;
		  const textWidth = ctx.measureText(timestamp).width;
		  const textHeight = fontSize * 1.2;
		  const paddingX = fontSize * 0.6;
		  const paddingY = fontSize * 0.4;

		  const boxX = (canvas.width - (textWidth + paddingX * 2)) / 2;
			
			let boxY = 85;
			if(screenHeight<675)
			{
				boxY = 10;
			}
		  
		  // Draw background box
		  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
		  ctx.fillRect(boxX, boxY, textWidth + paddingX * 2, textHeight + paddingY * 2);

		  // Draw text
		  ctx.fillStyle = 'white';
		  ctx.fillText(timestamp, boxX + paddingX, boxY + textHeight);
		}

		animationRef.current = requestAnimationFrame(draw);
	  }

	  draw();
	};


	//Start recording
	const startRecording = () => {
		const canvas = canvasRef.current;
		const video = videoRef.current;

		if (!canvas || !video) return;

		cameraDate(); 

		const canvasStream = canvas.captureStream(30); // 30 FPS
		const audioTracks = video.srcObject.getAudioTracks();
		const mixedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

		recordedChunksRef.current = [];

		const mediaRecorder = new MediaRecorder(mixedStream);
		mediaRecorderRef.current = mediaRecorder;

		mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				recordedChunksRef.current.push(event.data);
			}
		};

		mediaRecorder.onstop = () => {
			const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
			const url = URL.createObjectURL(blob);
			setVideoURL(url);
		};
		mediaRecorder.start();
		setRecording(true);
	};

	//Pause recording
	const pauseRecording = () => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
			mediaRecorderRef.current.pause();
			setIsPaused(true);
		}
	};

	//Resume recording
	const resumeRecording = () => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
			mediaRecorderRef.current.resume();
			setIsPaused(false);
		}
	};

	//Stop recording
	const stopRecording = () => {
		if (!mediaRecorderRef.current) return;

		setRecording(false);

		mediaRecorderRef.current.onstop = () => {
			const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
			const url = URL.createObjectURL(blob);
			setVideoURL(url);

			setTimeout(() => {
				stopCamera(); 
				setTimeout(() => {
					closeVideoModal(); 
				}, 200);
			}, 300); 
		};

		try {
			mediaRecorderRef.current.stop();
		} catch (e) {
			console.error('Error stopping MediaRecorder:', e);
		}
	};
  
	//Stop camera stream
	const stopCamera = (shouldCloseModal = true) => {
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
			animationRef.current = null;
		}

		if (videoRef.current && videoRef.current.srcObject) {
			videoRef.current.pause();
			videoRef.current.srcObject.getTracks().forEach(track => track.stop());
			videoRef.current.srcObject = null;
		}

		setStream(null);

		if (shouldCloseModal) {
			setTimeout(() => {
			  closeVideoModal(); 
			}, 200);
		}
	};
  
	const drawSnapshotWithTimestamp = () => {
	  const canvas = canvasRef.current;
	  const ctx = canvas?.getContext('2d');
	  const video = videoRef.current;

	  if (!video || !canvas || !ctx) return;

	  // Set canvas size to match video frame
	  canvas.width = video.videoWidth;
	  canvas.height = video.videoHeight;

	  // Draw video frame
	  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

	  // Draw timestamp
	  const timestamp = new Date().toLocaleString();
	  const fontSize = Math.max(canvas.width * 0.02, 12);
	  ctx.font = `${fontSize}px Arial`;
	  const textWidth = ctx.measureText(timestamp).width;
	  const textHeight = fontSize * 1.2;
	  const paddingX = fontSize * 0.6;
	  const paddingY = fontSize * 0.4;

	  const boxX = (canvas.width - (textWidth + paddingX * 2)) / 2;
	  const boxY = 85;

	  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
	  ctx.fillRect(boxX, boxY, textWidth + paddingX * 2, textHeight + paddingY * 2);

	  ctx.fillStyle = 'white';
	  ctx.fillText(timestamp, boxX + paddingX, boxY + textHeight);
	};
	
	const stopDrawingVideo = () => {
	  if (animationRef.current) {
		cancelAnimationFrame(animationRef.current);
		animationRef.current = null;
	  }
	};

	const [snapshotImage, setSnapshotImage] = useState(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState("line"); // or "circle", "square"


	// Take snapshot from video
	const takeSnapshot = () => {
		stopDrawingVideo(); // stop live video draw
		const video = videoRef.current;
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

		if (!video || !canvas || !ctx) return;

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		drawSnapshotWithTimestamp(); // draws frame + timestamp
		
		pauseRecording();

		// Save the snapshot image for future redraws
		const img = new Image();
		img.src = canvas.toDataURL('image/png');
		img.onload = () => {
		  setSnapshotImage(img);
		};
		
		setShapes([]); // Clear previous shapes
	};
	
	const saveCanvasWithShapes = () => {
	  const canvas = canvasRef.current;
	  const ctx = canvas.getContext("2d");

	  if (!canvas || !ctx || !snapshotImage) return;

	  // Clear canvas
	  ctx.clearRect(0, 0, canvas.width, canvas.height);

	  // Draw snapshot
	  ctx.drawImage(snapshotImage, 0, 0, canvas.width, canvas.height);

	  // Draw all shapes
	  for (const shape of shapes) {
		drawShape(ctx, shape);
	  }

	  // Now convert to image
	  const imageData = canvas.toDataURL("image/png");
	  setImages(prev => [...prev, imageData]);
	  
	  if(isPaused)
		{
			resumeRecording();
			cameraDate();
		}else{
			stopCamera();
		}

	  // Optional: give user feedback
	  alert("Snapshot with shapes saved!");
	};


	const handleMouseDown = (e) => {
		const rect = canvasRef.current.getBoundingClientRect();
		const scaleX = canvasRef.current.width / rect.width;
		const scaleY = canvasRef.current.height / rect.height;

		const x = (e.clientX - rect.left) * scaleX;
		const y = (e.clientY - rect.top) * scaleY;

		setStartPos({ x, y });
		setCurrentPos({ x, y });
		setIsDrawing(true);
	};

	const handleMouseMove = (e) => {
		if (!isDrawing) return;

		const rect = canvasRef.current.getBoundingClientRect();
		const scaleX = canvasRef.current.width / rect.width;
		const scaleY = canvasRef.current.height / rect.height;

		const x = (e.clientX - rect.left) * scaleX;
		const y = (e.clientY - rect.top) * scaleY;

		setCurrentPos({ x, y });

		drawAllShapes(x, y); // Show preview
	};

	const handleMouseUp = () => {
		if (!isDrawing || !startPos || !currentPos) return;

		const newShape = {
		  type: selectedShape,
		  start: startPos,
		  end: currentPos,
		};

		setShapes(prev => [...prev, newShape]);
		setIsDrawing(false);
		setStartPos(null);
		setCurrentPos(null);

		drawAllShapes(); // Redraw final shape
	};

  const drawAllShapes = (previewX, previewY) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw snapshot image
    if (snapshotImage) {
      ctx.drawImage(snapshotImage, 0, 0, canvas.width, canvas.height);
    }

    // Draw stored shapes
    for (const shape of shapes) {
      drawShape(ctx, shape);
    }

    // Draw live shape
    if (isDrawing && startPos && previewX !== undefined && previewY !== undefined) {
      drawShape(ctx, {
        type: selectedShape,
        start: startPos,
        end: { x: previewX, y: previewY },
      });
    }
  };

  const drawShape = (ctx, shape) => {
    const { type, start, end } = shape;

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;

    if (type === 'line') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (type === 'square') {
      let x = start.x;
	  let y = start.y;
	  let width = end.x - start.x;
	  let height = end.y - start.y;

	  // Adjust for negative width/height (dragging left/up)
	  if (width < 0) {
		x = end.x;
		width = -width;
	  }
	  if (height < 0) {
		y = end.y;
		height = -height;
	  }

	  ctx.strokeRect(x, y, width, height);
	  
    } else if (type === 'circle') {
      const radius = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }else if (type === 'arrow') {
		const { x: startX, y: startY } = start;
		const { x: endX, y: endY } = end;

		const headLength = 10;
		const angle = Math.atan2(endY - startY, endX - startX);

		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(endX, endY);
		ctx.lineTo(
		  endX - headLength * Math.cos(angle - Math.PI / 6),
		  endY - headLength * Math.sin(angle - Math.PI / 6)
		);
		ctx.lineTo(
		  endX - headLength * Math.cos(angle + Math.PI / 6),
		  endY - headLength * Math.sin(angle + Math.PI / 6)
		);
		ctx.lineTo(endX, endY);
		ctx.lineTo(
		  endX - headLength * Math.cos(angle - Math.PI / 6),
		  endY - headLength * Math.sin(angle - Math.PI / 6)
		);
		ctx.fill();
	  }
  };

  useEffect(() => {
  if (snapshotImage) {
    drawAllShapes();
  }
}, [snapshotImage, shapes]);
	
	//Remove image by index
	const removeImage = (indexToRemove) => {
		setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
	};
  
	const zoomIn = () => {
		setZoom(prev => Math.min(prev + 0.1, 3)); // max zoom 3x
	};

	const zoomOut = () => {
		setZoom(prev => Math.max(prev - 0.1, 1)); // min zoom 1x
	};

	const handleVideoClick = () => {
		const canvas = canvasRef.current;

		if (canvas) {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				canvas.requestFullscreen();
			}
		}
	};


  // Handle Form Submit
  const handleSubmit = async(e) => {
    e.preventDefault();

    const formData = new FormData();

	//Append customer & vehicle JSON
	formData.append('customer', JSON.stringify(customer));
	formData.append('vehicle', JSON.stringify(vehicle));
	formData.append('service', JSON.stringify(service));

	// Append video if recorded
	if (recordedChunksRef.current.length > 0) {
		const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
		formData.append('video', videoBlob, 'vehicle-recording.webm');
	}

	// Append snapshots
	if(images.length > 0)
	{
		images.forEach((img, index) => {
		  const byteString = atob(img.split(',')[1]);
		  const mimeString = img.split(',')[0].split(':')[1].split(';')[0];
		  const ab = new ArrayBuffer(byteString.length);
		  const ia = new Uint8Array(ab);
		  for (let i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		  }
		  const blob = new Blob([ab], { type: mimeString });
		  
		  // Append to array field `snapshots[]`
		  formData.append('snapshots[]', blob, `snapshot-${index + 1}.png`);  
		});
	}
	
    console.log('Form Data:', formData);
	try {
		let data = await postApiCall('home/jobCardCreate', formData)
		console.log("reeeeee",data);
		const { msg, status } = data.meta
		if (status) {
			toast.success(msg);
			setTimeout(()=>{ 
				window.location.href="/customer-data";
			}, 2000);
		} else {
			toast.error(msg);
			return false
		}
	} catch (err) {
		const { message } = err.response.data
		toast.error(message);
	}
  };
  
  
	const checkMobile = async(mobile) => {
		try {
			let data = await getApiCall('home/details/'+mobile, {},true)
			const { msg, status } = data.meta
			if (status) {
				toast.success(msg);
				
				setCustomer({
					fullName: data.data.details.fullName,
					email: data.data.details.email,
					dob: data.data.details.dob,
					//mobile: data.data.details.mobile,
					address: data.data.details.address,
					province: data.data.details.province,
					city: data.data.details.city,
					zipcode: data.data.details.zipcode,
				});
				
				setVehicle({
					plateNo: data.data.details.plateNo,
					series: data.data.details.series,
					model: data.data.details.model,
					year: data.data.details.year,
					warranty: data.data.details.warranty,
				});
  
				setService({
				  serviceType: data.data.details.serviceType,
				  jobCategory: data.data.details.jobCategory,
				  job: data.data.details.job,
				});
				
			} else {
				//toast.error(msg);
				
				setCustomer({
					fullName: '',
					email: '',
					dob: '',
					mobile: mobile,
					address: '',
					province: '',
					city: '',
					zipcode: '',
				});
				
				setVehicle({
					plateNo: '',
					series: '',
					model: '',
					year: '',
					warranty: '',
				});
  
				setService({
				  serviceType: '',
				  jobCategory: '',
				  job: '',
				});
				
				return false
			}
		} catch (err) {
			const { message } = err.response.data
			toast.error(message);
		}
	};

  return (
    <>
      {/* <Header /> */}

      <main className="main">
        <section className="homepad profilepage pt-0 pt-md-2 pt-lg-4">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <h2 className="font-size-24 font-weight-semibold text-center text-danger pb-0">
                  Create Job
                </h2>
              </div>
            </div>
            <div className="pt-md-4">
              <div className="row">
                <div className="col-12 col-lg-12 mx-lg-auto">
                  

                    {/* Customer Information Accordion */}
                    <div className="col-12 pb-1">
                      <Accordion defaultActiveKey="-1">
                        <Accordion.Item eventKey="custInfo">
                          <Accordion.Header className="text-danger">
                            <FaUser className="me-2" /> Customer Information
                          </Accordion.Header>
                          <Accordion.Body className="text-secondary">
                            <div className="row">
								{/* Mobile Number */}
                              <div className="col-lg-6 col-md-12" >
                                <div className="mb-1">
                                  <label className="form-label text-danger">Mobile Number:</label>
                                  <input 
                                    className="form-control " 
                                    type="text" 
                                    name="mobile"
                                    value={customer.mobile}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>
							  
                              {/* Full Name */}
                              <div className="col-lg-6 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Full Name:</label>
                                  <input 
                                    className="form-control " 
                                    type="text" 
                                    name="fullName"
                                    value={customer.fullName}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>

                              {/* Email ID */}
                              <div className="col-lg-6 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Email ID:</label>
                                  <input 
                                    className="form-control " 
                                    type="email" 
                                    name="email"
                                    value={customer.email}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>

                              {/* Date of Birth */}
                              <div className="col-lg-6 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">DOB:</label>
                                  <input 
                                    className="form-control " 
                                    type="date" 
                                    name="dob"
                                    value={customer.dob}
                                    onChange={handleCustomerChange}
                                  />
                                </div>
                              </div>

                              

                              {/* Address */}
                              <div className="col-lg-6 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Address:</label>
                                  <input 
                                    className="form-control " 
                                    type="text" 
                                    name="address"
                                    value={customer.address}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>

                              {/* Province */}
                              <div className="col-lg-6 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Province:</label>
                                  <input 
                                    className="form-control " 
                                    type="text" 
                                    name="province"
                                    value={customer.province}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>

                              {/* City */}
                              <div className="col-lg-6 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">City:</label>
                                  <input 
                                    className="form-control " 
                                    type="text" 
                                    name="city"
                                    value={customer.city}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>

                              {/* Zipcode */}
                              <div className="col-lg-6 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Zipcode</label>
                                  <input 
                                    className="form-control " 
                                    type="text" 
                                    name="zipcode"
                                    value={customer.zipcode}
                                    onChange={handleCustomerChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                    </div>

                    {/* Vehicle Information Accordion */}
                    <div className="col-12 pb-1">
                      <Accordion defaultActiveKey="-1">
                        <Accordion.Item eventKey="vehicleInfo">
                          <Accordion.Header className="text-danger">
                            <FaCar className="me-2" /> Vehicle Information
                          </Accordion.Header>
                          <Accordion.Body className="text-secondary">
                            <div className="row">
                              {/* Vehicle Plate */}
                              <div className="col-lg-6 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Vehicle Plate No.</label>
                                  <input 
                                    className="form-control " 
                                    type="text" 
                                    name="plateNo"
                                    value={vehicle.plateNo}
                                    onChange={handleVehicleChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>

                              {/* Vehicle Series */}
                              <div className="col-lg-6 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Vehicle Series</label>
                                  <input 
                                    className="form-control " 
                                    type="text" 
                                    name="series"
                                    value={vehicle.series}
                                    onChange={handleVehicleChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>

                              {/* Vehicle Model */}
                              <div className="col-lg-6 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Vehicle Model</label>
                                  <input 
                                    className="form-control " 
                                    type="text" 
                                    name="model"
                                    value={vehicle.model}
                                    onChange={handleVehicleChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>

                              {/* Vehicle Year */}
                              <div className="col-lg-6 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Vehicle Year</label>
                                  <input 
                                    className="form-control " 
                                    type="text" 
                                    name="year"
                                    value={vehicle.year}
                                    onChange={handleVehicleChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>

                              {/* Vehicle Warranty */}
                              <div className="col-lg-12 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Vehicle Warranty</label>
                                  <input 
                                    className="form-control " 
                                    type="text" 
                                    name="warranty"
                                    value={vehicle.warranty}
                                    onChange={handleVehicleChange}
                                    placeholder="Enter here" 
                                  />
                                </div>
                              </div>
							  
							  {/* video Recording starts */}
							  <div className="col-lg-12 col-md-12">
								  <label className="form-label text-danger fw-bold mt-2">🎥 Vehicle Recording</label>

								  <div className="mt-3 d-flex flex-wrap justify-content-center gap-2 text-center">
									<button className="btn btn-secondary" onClick={startCamera}>
									  <FaVideo  />
									</button>
									
									{!recording && (
									  <button className="btn btn-danger" onClick={stopCamera} disabled={!stream}>
										<FaPowerOff className="me-1" /> 
									  </button>
									)}
									
								  </div>
								  
								</div>
								
								{images.length > 0 && (
									  <>
									  <div className="col-lg-6 col-md-12">
										<label className="form-label fw-bold mt-2">🖼️ Captured Images</label>
										<div className="d-flex flex-wrap gap-3 mt-2">
										  {images.map((img, index) => (
											<div key={index} className="border p-2 rounded shadow-sm">
											  <div className="position-relative" style={{ width: 150 }}>
												<img
												  src={img}
												  alt={`Captured ${index}`}
												  className="img-fluid rounded"
												  style={{ width: '100%', height: 'auto' }}
												  onClick={() => openModal('image', img)}
												/>
												<button
												  onClick={() => removeImage(index)}
												  className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
												  title="Remove"
												  style={{ zIndex: 2 }}
												>
												  <FaTimes />
												</button>
												<a
													href={img}
													download={`snapshot-${index + 1}.png`}
													className="btn btn-sm btn-outline-primary position-absolute m-1"
													style={{ zIndex: 2, top:'30px', right:'0px' }}
												  >
													<FaDownload />
												  </a>
											  </div>
											  
											</div>
										  ))}
										</div>
										</div>
									  </>
									)}

								  {videoURL && (
									<div className="col-lg-6 col-md-12">
									  <label className="form-label fw-bold mt-2">📼 Recorded Video</label>
									  <div className="d-flex flex-wrap gap-3 mt-2">
									  <div
										onClick={() => openModal('video', videoURL)}
										style={{ cursor: 'pointer' }}
									  >
										  <video
											src={videoURL}
											controls
											className="border rounded"
											style={{ width: '100%', maxWidth: '100%' }}
										  />
									  </div>
									  <div className="mt-2" style={{position: 'absolute', right: '16%'}}>
										<a href={videoURL} download="recorded-video.webm" 
											className="btn btn-sm btn-outline-primary m-1"
													style={{ zIndex: 2, top:'30px', right:'0px' }}
										>
										  <FaDownload className="me-2 text-center" />
										</a>
									  </div>
									</div>
									</div>
								  )}
							  {/* video recording ends */}
							  
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                    </div>

                   {/* {/* Service Information Accordion */}
                    <div className="col-12">
                      <Accordion defaultActiveKey="-1">
                        <Accordion.Item eventKey="serviceInfo">
                          <Accordion.Header className="text-danger">
                            <FaWrench className="me-2" /> Service Information
                          </Accordion.Header>
                          <Accordion.Body className="text-secondary">
                            <div className="row">
							{/* Service Type */}
                              <div className="col-lg-4 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Service Type</label>
									<select 
										className="form-control " 
										name="serviceType"
										value={service.serviceType}
										onChange={(e) => setService({ ...service, [e.target.name]: e.target.value })}
									>
                                    <option value="">Select</option>
                                    <option value="General Repair">General Repair</option>
                                    <option value="Periodic Maintence">Periodic Maintence</option>
                                  </select>
                                </div>
                              </div>
							  
							  {/* Job Category */}
                              <div className="col-lg-4 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Job Category</label>
									<select 
										className="form-control "
										name="jobCategory"
										value={service.jobCategory}
										onChange={(e) => setService({ ...service, [e.target.name]: e.target.value })}
                                     
									>
                                    <option value="">Select</option>
                                    <option value="AC">AC</option>
                                    <option value="Car Wash">Car Wash</option>
                                  </select>
                                </div>
                              </div>
							  
							  {/* Job */}
                              <div className="col-lg-4 col-md-12">
                                <div className="mb-1">
                                  <label className="form-label text-danger">Job</label>
									<select 
										className="form-control " 
										name="job"
										value={service.job}
										onChange={(e) => setService({ ...service, [e.target.name]: e.target.value })}
									>
                                    <option value="">Select</option>
                                    <option value="Full Car Wash - $100">Full Car Wash - $100</option>
                                    <option value="Inner Car Wash - $70">Inner Car Wash - $70</option>
									<option value="Outer Car Wash - $80">Outer Car Wash - $80</option>
                                  </select>
                                </div>
                              </div>
							</div>
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                    </div>

                    {/* Save Button */}
                    <div className="row pt-4 mt-lg-3">
                      <div className="col-12 text-center mb-5">
                        <button className="btn btn-danger font-weight-medium font-size-16 text-capitalize px-4 "
						onClick={handleSubmit}
						>
                          Save
                        </button>
                      </div>
                    </div>


                </div>
              </div>
            </div>
          </div>
        </section>
		
			
			{/* modal video starts */}
			  {modalVideoOpen && (
				  <div
					className="modal show fade d-block"
					tabIndex="-1"
					style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
					onClick={closeVideoModal}
				  >
					<div
					  className="modal-dialog modal-fullscreen modal-dialog-centered"
					  onClick={(e) => e.stopPropagation()}
					>
					  <div className="modal-content border-0 shadow-lg rounded-4">
						<div className="modal-header border-0">
						  <h5 className="modal-title d-flex align-items-center gap-2" style={{ marginLeft:'2%' }}>
							🎥 Vehicle Recording
						  </h5>
						</div>
						<div className="modal-body text-center">
							
								  
									<div
									  className="video-wrapper border rounded"
									  style={{
										width: '100%',
										maxWidth: '100%',
										height:'95vh',
										position: 'relative',
										margin: '0 auto',
									  }}
									>
									  <video
										  ref={videoRef}
										  autoPlay
										  playsInline
										  muted
										  style={{
											position: 'absolute',
											top: 0,
											left: 0,
											width: '100vw',
											height: '100vh',
											opacity: 0,
											zIndex: -1,
										  }}
										/>

									  
									<canvas
										ref={canvasRef}
										onMouseDown={handleMouseDown}
										onMouseMove={handleMouseMove}
										onMouseUp={handleMouseUp}
										style={{ 
												cursor: 'crosshair',
												border: '1px solid #ccc',
												top: 0,
												left: 0,
												width: '100%',
												height: '100%',
												objectFit: 'cover', 
												transform: `scale(${zoom})`,
												transformOrigin: 'center',
												transition: 'transform 0.3s ease',
												zIndex: 1,
											}}
									/>
										  
										<div className="mt-3 d-flex flex-wrap justify-content-center gap-2 position-absolute bottom-0 p-3 w-100 swsbtn"
										style={{left:0, right:0}}>
											{recording && (
												<button className="btn btn-secondary" onClick={startCamera}>
												  <FaVideo />
												</button>
											)}
											
											{stream && (
												<>
												<button className="btn btn-secondary" onClick={takeSnapshot}>
													<FaCamera  />
												</button>
												
												<div className="dropdown">
												  {/* <button className="btn btn-secondary dropdown-toggle p-2 no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
													&#x22EE;
												  </button> */}
												  <ul className="dropdown-menu">
													<li>
													  <button className="dropdown-item" onClick={() => setSelectedShape("circle")}><BsCircle size={18} /> Circle</button>
													</li>
													<li>
													  <button className="dropdown-item" onClick={() => setSelectedShape("square")}><BsSquare size={18} /> Square</button>
													</li>
													<li>
													  <button className="dropdown-item" onClick={() => setSelectedShape("line")}><RxDash size={18} /> Line</button>
													</li>
													<li>
													  <button className="dropdown-item" onClick={() => setSelectedShape("arrow")}><HiOutlineArrowRight  size={18} /> Arrow</button>
													</li>
												  </ul>
												</div>
												<button className="btn btn-secondary" onClick={saveCanvasWithShapes}>
												  Save Snapshot
												</button>

												</>
											)}
											
											
											{!recording && (
											  <button className="btn btn-secondary" onClick={startRecording} disabled={!stream}>
												<FaRecordVinyl className="me-1" />
											  </button>
											)}
											
											{recording && !isPaused && (
											  <button onClick={pauseRecording} className="btn btn-secondary">
												<FaPause style={iconStyle} />
											  </button>
											)}

											{recording && isPaused && (
											  <button onClick={resumeRecording} className="btn btn-secondary">
												<FaPlay style={iconStyle} />
											  </button>
											)}

											{recording && (
											  <button className="btn btn-secondary" onClick={stopRecording} disabled={!stream}>
												<FaStop className="me-1" style={{color:'red'}} />
											  </button>
											)}

											{!recording && (
											  <button className="btn btn-danger" onClick={stopCamera} disabled={!stream}>
												<FaPowerOff className="me-1" /> 
											  </button>
											)}
										  </div>
									</div>
						</div>
					  </div>
					</div>
				  </div>
				)}

			  {/* modal video ends */}
							  
			{/* modal starts */}
			  {modalOpen && (
				  <div
					className="modal show fade d-block"
					tabIndex="-1"
					style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
					onClick={closeModal}
				  >
					<div
					  className="modal-dialog modal-lg modal-dialog-centered"
					  onClick={(e) => e.stopPropagation()}
					>
					  <div className="modal-content border-0 shadow-lg">
						<div className="modal-header border-0">
						  <h5 className="modal-title d-flex align-items-center gap-2" style={{marginLeft:'2%'}}>
							{modalContent.type === 'image' ? (
							  <BsImageFill className="text-primary" />
							) : (
							  <BsPlayBtnFill className="text-danger" />
							)}
							{modalContent.type === 'image' ? 'Image Preview' : 'Video Preview'}
						  </h5>
						  <button
							type="button"
							className="btn btn-sm btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center"
							onClick={closeModal}
							aria-label="Close"
							style={{ width: '30px', height: '30px' }}
						  >
							<BsXLg />
						  </button>
						</div>
						<div className="modal-body text-center">
						  {modalContent.type === 'image' ? (
							<img
							  src={modalContent.url}
							  alt="Preview"
							  className="img-fluid rounded"
							  style={{width:'99%', height:'99%'}}
							/>
						  ) : (
							<video
							  src={modalContent.url}
							  controls
							  autoPlay
							  className="img-fluid rounded"
							  style={{ maxHeight: '70vh' }}
							/>
						  )}
						</div>
					  </div>
					</div>
				  </div>
				)}

			  {/* modal ends */}

      </main>
    </>
  );
};

export default Home;

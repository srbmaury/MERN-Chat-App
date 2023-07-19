import axios from 'axios';

const uploadMedia = async (media, setMedia, setLoading, toast) => {
    setLoading(true);

    if (media === undefined) {
        toast({
            title: 'Please select an image!',
            status: 'warning',
            duration: 3000,
            isClosable: true,
            position: 'bottom',
        });
        setLoading(false);
        return;
    }

    if (media.type === 'image/jpeg' || media.type === 'image/png') {
        const formData = new FormData();
        formData.append('file', media);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            const response = await axios.post('/api/upload', formData, config);
            const { url } = response.data;

            setMedia(url.toString());
            setLoading(false);
        } catch (error) {
            console.log(error);
            setLoading(false);
        }
    } else {
        toast({
            title: 'Please select an image!',
            status: 'warning',
            duration: 3000,
            isClosable: true,
            position: 'bottom',
        });
        setLoading(false);
        return;
    }
};

export default uploadMedia;

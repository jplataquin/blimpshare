<?php
// generate_noise.php
$width = 256;
$height = 256;
$image = imagecreatetruecolor($width, $height);
for ($x = 0; $x < $width; $x++) {
    for ($y = 0; $y < $height; $y++) {
        // Create grayscale noise
        $c = mt_rand(0, 255);
        $color = imagecolorallocate($image, $c, $c, $c);
        imagesetpixel($image, $x, $y, $color);
    }
}
// Apply a tiny bit of smoothing so the clouds look natural instead of purely pixelated
for ($i=0; $i<5; $i++) {
    imagefilter($image, IMG_FILTER_GAUSSIAN_BLUR);
}

if (!is_dir(__DIR__ . '/public/images')) {
    mkdir(__DIR__ . '/public/images', 0755, true);
}
imagepng($image, __DIR__ . '/public/images/noise.png');
imagedestroy($image);
echo "Noise texture generated successfully at public/images/noise.png";
